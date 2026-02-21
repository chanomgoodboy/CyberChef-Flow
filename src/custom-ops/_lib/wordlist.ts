/**
 * Common English words for pattern matching / word desubstitution.
 *
 * ~3,000 common words. For each word we compute a "letter pattern"
 * (HELLO → ABCCD) so that monoalphabetic substitution ciphertext
 * can be matched against known patterns.
 */

// Top ~3000 common English words (3-10 letters), sorted alphabetically.
// This list is intentionally compact; extend if needed.
const RAW_WORDS = [
  'able','about','above','accept','across','act','add','afraid','after','again',
  'age','ago','agree','ahead','air','all','allow','almost','alone','along',
  'already','also','always','among','amount','ancient','and','anger','angle','animal',
  'answer','any','anything','appear','apple','area','arm','army','around','arrive',
  'art','ask','atom','attack','attempt','aunt','author','avoid','away','baby',
  'back','bad','bag','ball','band','bank','bar','base','basic','basket',
  'bat','bath','battle','bay','beach','bear','beat','beauty','because','become',
  'bed','been','before','began','begin','behind','being','believe','bell','belong',
  'below','bend','best','better','between','beyond','big','bill','bird','birth',
  'bit','black','blade','blame','block','blood','blow','blue','board','boat',
  'body','bone','book','born','both','bottom','bound','box','boy','brain',
  'branch','brave','bread','break','breath','bridge','brief','bright','bring','broad',
  'broke','brother','brought','brown','build','burn','bus','busy','but','buy',
  'cabin','call','calm','came','camp','can','captain','car','card','care',
  'carry','case','cast','cat','catch','cattle','caught','cause','cell','center',
  'central','century','certain','chain','chair','chance','change','character','charge','chart',
  'check','chief','child','children','choose','church','circle','city','claim','class',
  'clean','clear','climb','clock','close','cloth','clothes','cloud','coast','coat',
  'cold','collect','color','column','come','comfort','command','common','company','compare',
  'complete','condition','connect','consider','contain','continue','control','cook','cool','copy',
  'corn','corner','correct','cost','cotton','could','count','country','couple','course',
  'cover','cow','create','crop','cross','crowd','cry','cup','current','cut',
  'dad','dance','danger','dark','daughter','day','dead','deal','dear','death',
  'decide','deep','degree','depend','describe','desert','design','detail','develop','did',
  'die','differ','difficult','dinner','direct','discover','discuss','distant','divide','doctor',
  'does','dog','dollar','done','door','double','down','draw','dream','dress',
  'drink','drive','drop','dry','duck','during','dust','duty','each','ear',
  'early','earth','ease','east','eat','edge','effect','effort','egg','eight',
  'either','electric','element','else','empty','end','enemy','energy','engine','enjoy',
  'enough','enter','entire','equal','escape','even','evening','event','ever','every',
  'exact','example','except','excite','exercise','expect','experience','experiment','explain','express',
  'face','fact','fair','fall','family','famous','far','farm','fast','fat',
  'father','favor','fear','feed','feel','feet','fell','fellow','felt','few',
  'field','fight','figure','fill','final','find','fine','finger','finish','fire',
  'first','fish','fit','five','flat','floor','flow','flower','fly','follow',
  'food','foot','for','force','foreign','forest','forget','form','forward','found',
  'four','free','fresh','friend','from','front','fruit','full','fun','game',
  'garden','gas','gather','gave','general','gentle','get','girl','give','glad',
  'glass','gold','gone','good','got','govern','grand','grass','gray','great',
  'green','grew','ground','group','grow','guess','guide','gun','had','hair',
  'half','hall','hand','happen','happy','hard','has','hat','have','head',
  'hear','heart','heat','heavy','held','help','her','here','high','hill',
  'him','his','hit','hold','hole','home','hope','horse','hot','hotel',
  'hour','house','how','huge','human','hundred','hunt','hurry','hurt','husband',
  'ice','idea','imagine','inch','include','increase','indicate','industry','insect','inside',
  'instead','interest','iron','island','its','job','join','joy','judge','jump',
  'just','keep','kept','key','kill','kind','king','knew','know','labor',
  'lady','laid','lake','land','language','large','last','late','laugh','law',
  'lay','lead','learn','least','leave','led','left','leg','length','less',
  'let','letter','level','lie','life','lift','light','like','line','list',
  'listen','little','live','locate','log','lone','long','look','lord','lose',
  'lost','lot','loud','love','low','luck','made','main','major','make',
  'man','many','map','mark','market','master','match','matter','may','mean',
  'measure','meat','meet','melody','men','method','middle','might','mile','milk',
  'million','mind','mine','minute','miss','mix','modern','moment','money','month',
  'moon','more','morning','most','mother','motion','mountain','mouth','move','much',
  'music','must','name','nation','natural','nature','near','necessary','neck','need',
  'neighbor','never','new','next','night','nine','noise','none','nor','north',
  'nose','note','nothing','notice','noun','now','number','object','observe','occur',
  'ocean','off','offer','office','often','oil','old','once','one','only',
  'open','operate','opinion','order','organ','original','other','our','out','outside',
  'over','own','oxygen','page','paint','pair','paper','paragraph','parent','part',
  'particular','party','pass','past','path','pattern','pay','people','per','percent',
  'period','person','phrase','pick','picture','piece','pitch','place','plain','plan',
  'planet','plant','play','please','plural','poem','point','poor','populate','port',
  'position','possible','post','pound','power','practice','prepare','present','president','press',
  'pretty','price','print','probable','problem','process','produce','product','program','proper',
  'property','protect','prove','provide','pull','push','put','quarter','queen','question',
  'quick','quiet','quite','race','radio','rain','raise','ran','range','rather',
  'reach','read','ready','real','reason','receive','record','red','region','remain',
  'remember','remove','repeat','reply','report','represent','require','rest','result','return',
  'rich','ride','right','ring','rise','river','road','rock','roll','room',
  'root','rope','rose','round','row','rub','rule','run','safe','said',
  'sail','salt','same','sand','sang','sat','save','saw','say','school',
  'science','score','sea','search','season','seat','second','section','see','seed',
  'seem','select','self','sell','send','sense','sentence','separate','serve','set',
  'settle','seven','several','shall','shape','share','sharp','she','shell','shine',
  'ship','shoe','shop','shore','short','should','shoulder','shout','show','side',
  'sight','sign','silent','silver','similar','simple','since','sing','single','sister',
  'sit','six','size','skill','skin','sleep','slip','slow','small','smell',
  'smile','smoke','snow','soft','soil','soldier','solution','some','son','song',
  'soon','sort','sound','south','space','speak','special','speed','spell','spend',
  'spoke','spot','spread','spring','square','stage','stand','star','start','state',
  'station','stay','steam','steel','step','stick','still','stock','stone','stood',
  'stop','store','storm','story','straight','strange','stream','street','stretch','string',
  'strong','student','study','subject','substance','succeed','such','sudden','suffix','sugar',
  'suggest','suit','summer','sun','supply','support','sure','surface','surprise','swim',
  'symbol','system','table','tail','take','talk','tall','teach','team','tell',
  'ten','term','test','than','thank','that','the','their','them','then',
  'there','these','they','thick','thin','thing','think','third','this','those',
  'though','thought','thousand','three','through','throw','tie','time','tiny','tire',
  'together','told','tone','too','took','tool','top','total','touch','toward',
  'town','track','trade','train','travel','tree','triangle','trip','trouble','truck',
  'true','try','tube','turn','twenty','two','type','under','unit','until',
  'upon','use','usual','valley','value','vary','verb','very','view','village',
  'visit','voice','vowel','wait','walk','wall','want','war','warm','was',
  'wash','watch','water','wave','way','wear','weather','week','weight','welcome',
  'well','went','were','west','western','what','wheel','when','where','whether',
  'which','while','white','who','whole','whose','why','wide','wife','wild',
  'will','win','wind','window','wing','winter','wire','wish','with','woman',
  'women','won','wonder','wood','word','work','world','would','write','written',
  'wrong','wrote','yard','year','yellow','yes','yet','you','young','your',
];

/**
 * Compute letter pattern for a word: HELLO → ABCCD
 * Letters are mapped to sequential identifiers based on first appearance.
 */
export function letterPattern(word: string): string {
  const upper = word.toUpperCase();
  const map = new Map<string, string>();
  let next = 65; // 'A'
  let result = '';
  for (const ch of upper) {
    if (/[A-Z]/.test(ch)) {
      if (!map.has(ch)) {
        map.set(ch, String.fromCharCode(next++));
      }
      result += map.get(ch)!;
    }
  }
  return result;
}

/** Pre-built pattern → words index */
const PATTERN_INDEX = new Map<string, string[]>();

for (const w of RAW_WORDS) {
  const p = letterPattern(w);
  if (!PATTERN_INDEX.has(p)) {
    PATTERN_INDEX.set(p, []);
  }
  PATTERN_INDEX.get(p)!.push(w);
}

/**
 * Find words matching the given letter pattern.
 * Input can be a raw word (pattern computed) or a pre-computed pattern.
 */
export function findByPattern(wordOrPattern: string): string[] {
  // If it looks like a pattern already (all uppercase consecutive from A)
  const p = /^[A-Z]+$/.test(wordOrPattern) && isValidPattern(wordOrPattern)
    ? wordOrPattern
    : letterPattern(wordOrPattern);
  return PATTERN_INDEX.get(p) ?? [];
}

function isValidPattern(s: string): boolean {
  // Valid pattern: chars are sequential from A with no gaps
  const seen = new Set<string>();
  let maxCode = 64; // before 'A'
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    if (!seen.has(ch)) {
      if (code !== maxCode + 1) return false;
      maxCode = code;
      seen.add(ch);
    }
  }
  return true;
}

/** Get the raw word list */
export function getWordList(): string[] {
  return RAW_WORDS;
}

/** Get the full pattern index */
export function getPatternIndex(): Map<string, string[]> {
  return PATTERN_INDEX;
}
