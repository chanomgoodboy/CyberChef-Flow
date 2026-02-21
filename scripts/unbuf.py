#!/usr/bin/env python3
"""
Force line-buffered stdout by wrapping it in a PTY.

Usage: python3 unbuf.py <command> [args...]

Creates a pseudo-terminal for the child's stdout only, so the child
process sees a TTY and uses line buffering. Stderr remains a normal
pipe (inherited from the parent) so it can be captured separately.
"""
import sys, os, select, termios, pty

if len(sys.argv) < 2:
    sys.exit(0)

# Create a PTY pair — only used for stdout
master_fd, slave_fd = pty.openpty()

# Configure the PTY: no echo, no CR insertion
try:
    attrs = termios.tcgetattr(master_fd)
    attrs[1] &= ~termios.ONLCR  # output: no \r insertion
    attrs[3] &= ~termios.ECHO   # local: no echo
    termios.tcsetattr(master_fd, termios.TCSANOW, attrs)
except termios.error:
    pass

pid = os.fork()

if pid == 0:
    # Child: redirect only stdout to the PTY slave
    os.close(master_fd)
    os.dup2(slave_fd, 1)   # stdout → PTY slave
    os.close(slave_fd)
    # stderr stays inherited (normal pipe from Node.js parent)
    # stdin stays /dev/null (inherited from Node.js parent)
    os.execvp(sys.argv[1], sys.argv[1:])
else:
    # Parent: relay PTY master → our stdout
    os.close(slave_fd)

    while True:
        try:
            r, _, _ = select.select([master_fd], [], [], 1.0)
            if r:
                data = os.read(master_fd, 4096)
                if not data:
                    break
                os.write(1, data)
        except OSError:
            break

    os.close(master_fd)
    _, status = os.waitpid(pid, 0)
    code = os.WEXITSTATUS(status) if os.WIFEXITED(status) else 1
    sys.exit(code)
