import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'OpenSSL (Backend)';

class BackendOpenssl extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'openssl';
    this.name = NAME;
    this.description = 'Parse certificates, keys, ASN.1, or compute digests with OpenSSL.';
    this.infoURL = 'https://www.openssl.org/docs/man3.0/man1/';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [
      { name: 'Mode', type: 'option', value: ['X.509 Cert', 'PKCS12', 'RSA Key', 'ASN.1 Parse', 'Digest'] },
      { name: 'Password / Algorithm', type: 'string', value: '' },
    ];
  }

  protected buildToolArgs(args: any[]) {
    const modeMap: Record<string, string> = {
      'X.509 Cert': 'x509', 'PKCS12': 'pkcs12', 'RSA Key': 'rsa', 'ASN.1 Parse': 'asn1', 'Digest': 'dgst',
    };
    return {
      mode: modeMap[args[0] as string] ?? 'x509',
      password: args[1] as string,
      algorithm: args[1] as string,
    };
  }
}

registerBackendOp(BackendOpenssl, {
  name: NAME,
  description: 'Parse certificates, keys, ASN.1, or compute digests with OpenSSL.',
  infoURL: 'https://www.openssl.org/docs/man3.0/man1/',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [
    { name: 'Mode', type: 'option', value: ['X.509 Cert', 'PKCS12', 'RSA Key', 'ASN.1 Parse', 'Digest'] },
    { name: 'Password / Algorithm', type: 'string', value: '' },
  ],
});
