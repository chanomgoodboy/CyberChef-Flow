// Barrel file — side-effect imports register each esolang interpreter.
// Each import triggers registerCustomOp() in the module.

// Brainfuck family
import './BrainfuckInterpreter';
import './OokInterpreter';
import './BinaryfuckInterpreter';
import './BlubInterpreter';
import './PikalangInterpreter';
import './ReverseFuckInterpreter';
import './SpoonInterpreter';
import './CowInterpreter';
import './AlphuckInterpreter';
import './HodorInterpreter';

// Standalone interpreters
import './DeadfishInterpreter';
import './WhitespaceInterpreter';
import './ChickenInterpreter';
import './LolcodeInterpreter';
import './MalbolgeInterpreter';
import './ShakespeareInterpreter';

// JS-based decode
import './JSFuckDecode';
import './AAEncodeDecode';
import './JavascriptKeycodes';
import './JavascriptUnobfuscator';
