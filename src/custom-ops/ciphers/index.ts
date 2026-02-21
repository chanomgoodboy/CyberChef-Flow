// Barrel file — side-effect imports register each cipher with the custom op registry.
// Each import triggers registerCustomOp() in the cipher module.

// Group A: Polyalphabetic
import './BeaufortCipher';
import './GronsfeldCipherEncode';
import './GronsfeldCipherDecode';
import './TrithemiusCipherEncode';
import './TrithemiusCipherDecode';
import './PortaCipher';
import './MultiplicativeCipherEncode';
import './MultiplicativeCipherDecode';

// Group B: Polybius Grid
import './PolybiusCipherEncode';
import './PolybiusCipherDecode';
import './ADFGXCipherEncode';
import './ADFGXCipherDecode';
import './ADFGVXCipherEncode';
import './ADFGVXCipherDecode';
import './NihilistCipherEncode';
import './NihilistCipherDecode';
import './FourSquareCipherEncode';
import './FourSquareCipherDecode';
import './TwoSquareCipherEncode';
import './TwoSquareCipherDecode';

// Group C: Transposition
import './ColumnarTranspositionEncode';
import './ColumnarTranspositionDecode';
import './ScytaleCipherEncode';
import './ScytaleCipherDecode';
import './SkipCipher';

// Group D: Monoalphabetic Substitution
import './KeywordCipherEncode';
import './KeywordCipherDecode';
import './PigpenCipherEncode';
import './PigpenCipherDecode';
import './TapCodeEncode';
import './TapCodeDecode';

// Group E: Standalone
import './PlayfairCipherEncode';
import './PlayfairCipherDecode';
import './HillCipherEncode';
import './HillCipherDecode';
import './BookCipher';

// Group F: Keyboard & ASCII
import './KeyboardShiftCipher';
import './KeyboardChangeCipher';
import './ASCIIShiftCipherEncode';
import './ASCIIShiftCipherDecode';
import './PhoneKeypadEncode';
import './PhoneKeypadDecode';

// Group G: More Polyalphabetic
import './AutokeyCipherEncode';
import './AutokeyCipherDecode';
import './VariantBeaufortCipherEncode';
import './VariantBeaufortCipherDecode';
import './AlbertiCipherEncode';
import './AlbertiCipherDecode';
import './ChaocipherEncode';
import './ChaocipherDecode';
import './ProgressiveCaesarEncode';
import './ProgressiveCaesarDecode';

// Group H: Fractionation
import './TrifidCipherEncode';
import './TrifidCipherDecode';
import './FractionatedMorseEncode';
import './FractionatedMorseDecode';
import './MorbitCipherEncode';
import './MorbitCipherDecode';
import './PolluxCipherEncode';
import './PolluxCipherDecode';

// Group I: More Transposition
import './DoubleTranspositionEncode';
import './DoubleTranspositionDecode';
import './AMSCOCipherEncode';
import './AMSCOCipherDecode';
import './RouteCipherEncode';
import './RouteCipherDecode';
import './RedefenceCipherEncode';
import './RedefenceCipherDecode';
import './TurningGrilleEncode';
import './TurningGrilleDecode';

// Group J: More Polygrammic
import './CollonCipherEncode';
import './CollonCipherDecode';
import './DigrafidCipherEncode';
import './DigrafidCipherDecode';
import './ThreeSquareCipherEncode';
import './ThreeSquareCipherDecode';

// Group K: Other Substitution
import './WolseleyCipher';
import './HomophonicCipherEncode';
import './HomophonicCipherDecode';
import './MonomeDinomeEncode';
import './MonomeDinomeDecode';
import './BazeriesCipherEncode';
import './BazeriesCipherDecode';

// Group L: Steganography
import './ZWSpaceEncode';
import './ZWSpaceDecode';

// Group N: ROT Variants & Base Encodings
import './ROT5Cipher';
import './ROT18Cipher';
import './ROT1Cipher';
import './Base100Encode';
import './Base100Decode';
import './Base26Encode';
import './Base26Decode';
import './Base36Encode';
import './Base36Decode';
import './Base37Encode';
import './Base37Decode';
import './LetterPositionEncode';
import './LetterPositionDecode';
import './Base91Encode';
import './Base91Decode';
import './Base65536Encode';
import './Base65536Decode';
import './Base32CrockfordEncode';
import './Base32CrockfordDecode';
import './ZBase32Encode';
import './ZBase32Decode';

// Group O: Lookup-Table Ciphers
import './KennyLanguageEncode';
import './KennyLanguageDecode';
import './DiceNumbersEncode';
import './DiceNumbersDecode';
import './MusicNotesEncode';
import './MusicNotesDecode';
import './GreekLetterNumberEncode';
import './GreekLetterNumberDecode';
import './NavajoCodeEncode';
import './NavajoCodeDecode';
import './MalespinCipher';
import './AlphabeticalRanksEncode';
import './AlphabeticalRanksDecode';

// Group P: Keyboard & Physical Ciphers
import './KeyboardCoordinatesEncode';
import './KeyboardCoordinatesDecode';
import './LSPK90Encode';
import './LSPK90Decode';
import './NumpadDrawEncode';
import './NumpadDrawDecode';
import './DTMFCodeEncode';
import './DTMFCodeDecode';
import './T9Encode';
import './T9Decode';
import './ALTCodesEncode';
import './ALTCodesDecode';
import './ASCIIControlEncode';
import './ASCIIControlDecode';

// Group Q: Substitution Variants
import './ScreamCipherEncode';
import './ScreamCipherDecode';
import './UnicodeShiftEncode';
import './UnicodeShiftDecode';
import './ConsonantsVowelsEncode';
import './ConsonantsVowelsDecode';
import './TriliteralCipherEncode';
import './TriliteralCipherDecode';
import './CipherDiskEncode';
import './CipherDiskDecode';
import './AlphabeticTranscriptionEncode';
import './AlphabeticTranscriptionDecode';
import './GravityFallsEncode';
import './GravityFallsDecode';

// Group R: Historical & Complex Ciphers
import './RozierCipherEncode';
import './RozierCipherDecode';
import './PeriodicTableEncode';
import './PeriodicTableDecode';
import './PrimeNumbersCipherEncode';
import './PrimeNumbersCipherDecode';
import './VICCipherEncode';
import './VICCipherDecode';
import './TrithemiusAveMariaEncode';
import './TrithemiusAveMariaDecode';
import './PGPWordListEncode';
import './PGPWordListDecode';
import './WabunCodeEncode';
import './WabunCodeDecode';

// Group S: Math, Grid & Fun Ciphers
import './PrimeMultiplicationEncode';
import './PrimeMultiplicationDecode';
import './GridCoordinatesEncode';
import './GridCoordinatesDecode';
import './TwinHexEncode';
import './TwinHexDecode';
import './BinaryCharacterShapesEncode';
import './BinaryCharacterShapesDecode';
import './ShankarSpeechDefectEncode';
import './ShankarSpeechDefectDecode';
import './NakNakEncode';
import './NakNakDecode';
import './GenshinImpactEncode';
import './GenshinImpactDecode';

// Group T: Niche Regional & Historical
import './GS8BrailleEncode';
import './GS8BrailleDecode';
import './WeatherWKSEncode';
import './WeatherWKSDecode';
import './IndienneCodeEncode';
import './IndienneCodeDecode';
import './D3CodeEncode';
import './D3CodeDecode';
import './K6CodeEncode';
import './K6CodeDecode';
import './K7CodeEncode';
import './K7CodeDecode';
import './JISKeyboardEncode';
import './JISKeyboardDecode';

// Group V: Encoding Formats
import './BaudotCodeEncode';
import './BaudotCodeDecode';
import './GrayCodeEncode';
import './GrayCodeDecode';
import './BubbleBabbleEncode';
import './BubbleBabbleDecode';
import './ChuckNorrisUnaryEncode';
import './ChuckNorrisUnaryDecode';
import './WingdingsEncode';
import './WingdingsDecode';
import './ZalgoTextEncode';
import './ZalgoTextDecode';
import './UUencodeEncode';
import './UUencodeDecode';
import './HexagramEncode';
import './HexagramDecode';
import './LEB128Encode';
import './LEB128Decode';

// Group U: Analysis Tools & Detection
import './DerangedAlphabetGenerator';
import './WordPattern';
import './WordSubstitutionEncode';
import './WordSubstitutionDecode';
import './MultiLayerDetector';
import './McCormickDetector';
import './MedievalCipherDetector';

// Group W: Asymmetric / Number Theory
import './RSACipherEncode';
import './RSACipherDecode';
import './RSACipherAttack';

// Group M: Analysis
import './CipherIdentifier';

// Group X: Forensics
import './BinwalkScan';
