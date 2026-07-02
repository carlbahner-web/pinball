// Phrase pattern database for analyzing music producer / recording engineer
// website copy. Three buckets:
//
//   cliche   — overused AI-generated-sounding phrases (heavily penalized)
//   generic  — industry boilerplate that any studio could claim (mildly penalized)
//   standout — concrete, verifiable, distinctive signals (rewarded)
//
// Each entry: { id, label, re, weight, fix? }
//   re     — regex source, compiled case-insensitive
//   weight — how much each hit moves the score
//   fix    — a suggested rewrite direction, surfaced in the report

const CLICHES = [
  // --- The classic AI marketing verbs ---
  { id: 'elevate', label: '"elevate your sound/music"', re: 'elevat(?:e|ing|es)\\s+(?:your|the|their)\\s+(?:sound|music|tracks?|songs?|mixes?|project|art|craft|brand)', weight: 3, fix: 'Say what actually changes: "your vocal will sit in front of the mix without fighting the snare."' },
  { id: 'elevate-bare', label: '"elevate" (as a marketing verb)', re: '\\belevat(?:e|ing|es)\\b', weight: 1.5, fix: 'Swap for a concrete verb: tighten, de-ess, widen, glue, re-amp.' },
  { id: 'next-level', label: '"take it to the next level"', re: '(?:take|taking|takes|bring|brings)\\s+(?:your|their|it|them|[a-z]+\\s)?\\s*(?:music|sound|songs?|tracks?|mixes?|career|project)?\\s*to\\s+(?:the|a)\\s+(?:whole\\s+)?(?:next|new)\\s+level', weight: 3, fix: 'Name the level: "mixes that hold up on a club system and a phone speaker."' },
  { id: 'next-level-bare', label: '"next-level"', re: '\\bnext[- ]level\\b', weight: 1.5 },
  { id: 'unleash', label: '"unleash"', re: '\\bunleash(?:ing|es|ed)?\\b', weight: 2.5, fix: 'Nothing is caged. Describe the specific result instead.' },
  { id: 'unlock', label: '"unlock your potential"', re: '\\bunlock(?:ing|s)?\\s+(?:your|the|their)\\s+(?:full\\s+|true\\s+|creative\\s+)?potential', weight: 3, fix: 'Potential is unfalsifiable. Cite a before/after or a credit instead.' },
  { id: 'unlock-bare', label: '"unlock" (marketing verb)', re: '\\bunlock(?:ing|s)?\\b', weight: 1 },
  { id: 'empower', label: '"empowering artists"', re: '\\bempower(?:ing|s|ed)?\\b', weight: 2 },
  { id: 'harness', label: '"harness the power of"', re: '\\bharness(?:ing|es)?\\s+the\\s+power', weight: 2.5 },
  { id: 'transform', label: '"transform your sound"', re: '\\btransform(?:ing|s)?\\s+(?:your|the|their)\\s+(?:sound|music|tracks?|songs?|ideas?|demos?)', weight: 2, fix: 'Describe the transformation: "rough voice-memo demos become finished radio edits."' },

  // --- Journey / vision / passion abstractions ---
  { id: 'sonic-journey', label: '"sonic journey"', re: '\\bsonic\\s+(?:journey|adventure|odyssey|voyage)', weight: 3, fix: 'Nobody books a journey. Name genres, rooms, and records.' },
  { id: 'sonic-x', label: '"sonic excellence/landscape/tapestry"', re: '\\bsonic\\s+(?:excellence|landscapes?|tapestr(?:y|ies)|identit(?:y|ies)|perfection|masterpiece)', weight: 2.5 },
  { id: 'embark', label: '"embark on a journey"', re: '\\bembark(?:ing|s|ed)?\\s+on\\b', weight: 2.5 },
  { id: 'journey', label: '"musical journey"', re: '\\b(?:musical|creative|artistic)\\s+journey', weight: 2 },
  { id: 'vision-to-life', label: '"bring your vision to life"', re: '\\bbring(?:ing|s)?\\s+(?:your|their|that|the|artists.?)\\s+(?:musical\\s+|creative\\s+|artistic\\s+)?visions?\\s+to\\s+(?:life|reality|fruition)', weight: 3, fix: 'Every studio claims this. Show a project where you did it, with names and a listen link.' },
  { id: 'passion-for', label: '"passion for music"', re: '\\bpassion(?:ate)?\\s+(?:for|about)\\s+(?:music|sound|audio|the\\s+craft)', weight: 2, fix: 'Passion is table stakes. Years behind a specific console or a discography say it better.' },
  { id: 'crafted-with', label: '"crafted with passion/precision"', re: '\\b(?:crafted|created|made|mixed|produced)\\s+with\\s+(?:passion|precision|care|love|intention)', weight: 2.5 },
  { id: 'meticulously', label: '"meticulously crafted"', re: '\\bmeticulous(?:ly)?\\b', weight: 1.5 },
  { id: 'breathe-life', label: '"breathe new life into"', re: '\\bbreath(?:e|ing|es)\\s+(?:new\\s+)?life\\s+into', weight: 2.5 },
  { id: 'magic', label: '"where the magic happens / capture the magic"', re: '\\b(?:where\\s+(?:the\\s+)?magic\\s+happens|captur(?:e|ing)\\s+the\\s+magic|create\\s+magic|make\\s+magic)', weight: 2.5, fix: 'Magic is what people say when they can’t describe the process. Describe the process.' },

  // --- Setting / world framing ---
  { id: 'fast-paced', label: '"in today’s fast-paced world"', re: 'in\\s+today.?s\\s+(?:fast[- ]paced|digital|ever[- ]changing|competitive|modern|crowded)\\s+(?:world|music\\s+(?:industry|scene|landscape)|industry|landscape|market)', weight: 3, fix: 'Delete the sentence. Nothing after this framing is ever specific.' },
  { id: 'ever-evolving', label: '"ever-evolving landscape"', re: '\\bever[- ](?:evolving|changing|growing)\\b', weight: 2.5 },
  { id: 'landscape', label: '"the music landscape"', re: '\\b(?:music(?:al)?|audio|creative|industry)\\s+landscape', weight: 2 },
  { id: 'realm', label: '"the realm of"', re: '\\b(?:realm|world)\\s+of\\s+(?:music|sound|audio|possibilit)', weight: 2 },
  { id: 'stand-out-crowd', label: '"stand out from the crowd"', re: '\\bstand(?:s|ing)?\\s+out\\s+(?:from|in)\\s+(?:the\\s+crowd|a\\s+crowded)', weight: 2.5, fix: 'Ironically, this phrase guarantees you don’t.' },
  { id: 'saturated', label: '"in a saturated market"', re: '\\b(?:saturated|crowded|competitive)\\s+(?:market|industry|scene)', weight: 2 },

  // --- Superlatives with no evidence ---
  { id: 'world-class', label: '"world-class"', re: '\\bworld[- ]class\\b', weight: 2, fix: 'Which world? Replace with the credit or gear that would earn it.' },
  { id: 'top-tier', label: '"top-tier / top-notch"', re: '\\btop[- ](?:tier|notch)\\b', weight: 2 },
  { id: 'unparalleled', label: '"unparalleled / unmatched"', re: '\\bunparallel?ed|unmatched|unrivalled|unrivaled\\b', weight: 2.5 },
  { id: 'second-to-none', label: '"second to none"', re: '\\bsecond\\s+to\\s+none\\b', weight: 2.5 },
  { id: 'cutting-edge', label: '"cutting-edge"', re: '\\bcutting[- ]edge\\b', weight: 2, fix: 'Name the tools. "Atmos 7.1.4 room, HDX rig" beats "cutting-edge technology."' },
  { id: 'state-of-art', label: '"state-of-the-art"', re: '\\bstate[- ]of[- ]the[- ]art\\b', weight: 2, fix: 'Name the console, the monitors, the converters. Specifics are the flex.' },
  { id: 'game-changer', label: '"game-changer"', re: '\\bgame[- ]chang(?:er|ing)\\b', weight: 2.5 },
  { id: 'look-no-further', label: '"look no further"', re: '\\blook\\s+no\\s+further\\b', weight: 3 },
  { id: 'one-stop', label: '"one-stop shop"', re: '\\bone[- ]stop\\s+(?:shop|destination|solution)\\b', weight: 2.5 },

  // --- AI-tell sentence constructions ---
  { id: 'not-just', label: '"it’s not just X, it’s Y"', re: "(?:is|it.?s)\\s+not\\s+just\\s+(?:a\\s+|an\\s+|about\\s+)?[\\w' -]{2,40}[,;—-]+\\s*(?:it.?s|but|is)", weight: 3, fix: 'The signature AI construction. Just say the second thing.' },
  { id: 'more-than-just', label: '"more than just"', re: '\\bmore\\s+than\\s+just\\s+(?:a|an|music|sound|beats?|mixing)', weight: 2.5 },
  { id: 'whether-or', label: '"whether you’re X or Y"', re: "whether\\s+you.?re?\\s+(?:a\\s+|an\\s+)?[\\w' -]{2,50}\\s+or\\s+", weight: 2, fix: 'Trying to address everyone addresses no one. Pick your actual client.' },
  { id: 'seasoned-pro', label: '"seasoned pro or just starting out"', re: '\\bseasoned\\s+(?:pro(?:fessional)?|artist|veteran)|just\\s+starting\\s+out\\b', weight: 2.5 },
  { id: 'from-to', label: '"from concept to completion"', re: '\\bfrom\\s+(?:concept|idea|demo|start|inception|vision)\\s+to\\s+(?:completion|finish|final\\s+master|reality|release)', weight: 2.5 },
  { id: 'testament', label: '"a testament to"', re: '\\btestament\\s+to\\b', weight: 2.5 },
  { id: 'tapestry', label: '"tapestry"', re: '\\btapestr(?:y|ies)\\b', weight: 3 },
  { id: 'vibrant', label: '"vibrant"', re: '\\bvibrant\\b', weight: 1.5 },
  { id: 'delve', label: '"delve / dive into"', re: '\\b(?:delv(?:e|ing|es)|div(?:e|ing)\\s+(?:deep\\s+)?into)\\b', weight: 2 },
  { id: 'immerse', label: '"immerse yourself"', re: '\\bimmers(?:e|ive|ing)\\b', weight: 1.5 },
  { id: 'seamless', label: '"seamless / seamlessly"', re: '\\bseamless(?:ly)?\\b', weight: 2 },
  { id: 'wealth-of', label: '"a wealth of experience"', re: '\\b(?:a\\s+)?wealth\\s+of\\s+(?:experience|knowledge)', weight: 2 },
  { id: 'rest-assured', label: '"rest assured"', re: '\\brest\\s+assured\\b', weight: 2.5 },
  { id: 'perfect-blend', label: '"the perfect blend of"', re: '\\b(?:the\\s+)?perfect\\s+(?:blend|mix|balance|fusion)\\s+of\\b', weight: 2.5 },
  { id: 'boasts', label: '"boasts"', re: '\\bboast(?:s|ing)?\\b', weight: 2 },
  { id: 'nestled', label: '"nestled in"', re: '\\bnestled\\b', weight: 2 },
  { id: 'push-boundaries', label: '"pushing boundaries"', re: '\\bpush(?:ing|es)?\\s+(?:the\\s+)?(?:sonic\\s+|creative\\s+)?boundaries\\b', weight: 2.5 },
  { id: 'leave-impression', label: '"leave a lasting impression"', re: '\\bleave\\s+a\\s+lasting\\s+(?:impression|impact)|\\blasting\\s+impression\\b', weight: 2.5 },
  { id: 'resonate', label: '"resonates with audiences"', re: '\\bresonat(?:e|es|ing)\\s+with\\s+(?:audiences|listeners|fans|your\\s+audience)', weight: 2.5 },
  { id: 'soundscape', label: '"soundscapes"', re: '\\bsoundscapes?\\b', weight: 1.5 },
  { id: 'dreams-reality', label: '"turn dreams into reality"', re: '\\b(?:dreams?\\s+(?:in)?to\\s+reality|turn(?:ing)?\\s+(?:your\\s+)?dreams?)\\b', weight: 2.5 },
  { id: 'deserves', label: '"your music deserves"', re: '\\byour\\s+(?:music|songs?|tracks?|art|sound)\\s+deserves?\\b', weight: 2.5 },
  { id: 'let-your-shine', label: '"let your music shine"', re: '\\blet\\s+(?:your|the)\\s+[\\w ]{0,20}\\s*shine\\b', weight: 2.5 },
];

const GENERIC = [
  { id: 'professional-quality', label: '"professional quality/sound"', re: '\\bprofessional\\s+(?:quality|sound(?:ing)?|results?|grade|standard)\\b', weight: 1.5, fix: 'Professional is the baseline, not the pitch. Prove it with credits or audio.' },
  { id: 'high-quality', label: '"high-quality audio/production"', re: '\\bhigh[- ]quality\\s+(?:sound|audio|production|recordings?|mixes?|results?|music)\\b', weight: 1.5 },
  { id: 'radio-ready', label: '"radio-ready"', re: '\\bradio[- ]ready\\b', weight: 2, fix: 'Which radio? If you have airplay credits, name them; if not, drop it.' },
  { id: 'industry-standard', label: '"industry-standard"', re: '\\bindustry[- ]standard\\b', weight: 1.5 },
  { id: 'affordable', label: '"affordable rates"', re: '\\bafford(?:able|ability)\\s*(?:rates?|prices?|pricing)?\\b', weight: 1.5, fix: 'Post the actual prices. Transparency is rarer than "affordable."' },
  { id: 'competitive-rates', label: '"competitive rates"', re: '\\bcompetitive\\s+(?:rates?|prices?|pricing)\\b', weight: 1.5 },
  { id: 'all-genres', label: '"all genres"', re: '\\ball\\s+(?:genres|styles|kinds\\s+of\\s+music)\\b|\\bany\\s+genre\\b|\\bevery\\s+genre\\b', weight: 2, fix: 'Nobody is great at every genre. Naming yours filters in the right clients.' },
  { id: 'no-project-too', label: '"no project too big or small"', re: '\\bno\\s+(?:project|job)\\s+(?:is\\s+)?too\\s+(?:big|small|large)\\b', weight: 2 },
  { id: 'fast-turnaround', label: '"fast turnaround"', re: '\\b(?:fast|quick|rapid)\\s+turn[- ]?around\\b', weight: 1.5, fix: '"Mixes delivered in 5 business days, two revisions included" is a real promise.' },
  { id: 'satisfaction', label: '"satisfaction guaranteed"', re: '\\bsatisfaction\\s+guaranteed\\b|100%\\s+satisfaction', weight: 2 },
  { id: 'years-exp', label: '"years of experience" (unspecified)', re: '\\b(?:many\\s+|several\\s+)?years\\s+of\\s+experience\\b', weight: 1.5, fix: 'Give the number and what it was spent on: "14 years, ~400 records mixed."' },
  { id: 'clients-worldwide', label: '"clients around the world"', re: '\\b(?:artists?|clients?|musicians?)\\s+(?:from\\s+)?(?:all\\s+(?:over|around)|around)\\s+the\\s+(?:world|globe)\\b|\\bworldwide\\s+client', weight: 1.5 },
  { id: 'contact-today', label: '"contact us today"', re: '\\b(?:contact|call|reach\\s+out\\s+to)\\s+(?:us|me)\\s+today\\b|\\bget\\s+in\\s+touch\\s+today\\b', weight: 1 },
  { id: 'free-consult', label: '"free consultation"', re: '\\bfree\\s+consultation\\b', weight: 1 },
  { id: 'friendly', label: '"friendly, professional service"', re: '\\bfriendly\\s+(?:and\\s+professional\\s+)?(?:service|environment|atmosphere|staff|team)\\b', weight: 1.5 },
  { id: 'relaxed-environment', label: '"relaxed, creative environment"', re: '\\b(?:relaxed|comfortable|creative|welcoming)\\s+(?:and\\s+\\w+\\s+)?(?:environment|atmosphere|space|vibe)\\b', weight: 1.5 },
  { id: 'dedicated', label: '"dedicated/committed to excellence"', re: '\\b(?:dedicated|committed)\\s+to\\s+(?:excellence|quality|providing|delivering|your)\\b', weight: 2 },
  { id: 'exceed-expectations', label: '"exceed your expectations"', re: '\\bexceed(?:ing|s)?\\s+(?:your\\s+)?expectations\\b', weight: 2 },
  { id: 'pride-ourselves', label: '"we pride ourselves"', re: '\\b(?:pride\\s+(?:ourselves|myself)|take\\s+(?:great\\s+)?pride\\s+in)\\b', weight: 2 },
  { id: 'attention-detail', label: '"attention to detail"', re: '\\battention\\s+to\\s+detail\\b', weight: 1.5 },
  { id: 'best-possible', label: '"the best possible sound"', re: '\\bbest\\s+possible\\s+(?:sound|results?|quality|mix|version)\\b', weight: 1.5 },
  { id: 'full-service', label: '"full-service studio"', re: '\\bfull[- ]service\\b', weight: 1.5 },
  { id: 'we-offer', label: '"we offer a wide range of services"', re: '\\b(?:offer|provide)s?\\s+a\\s+(?:wide|full|broad|comprehensive)\\s+(?:range|variety|array|suite)\\s+of\\b', weight: 2 },
  { id: 'sound-its-best', label: '"make your music sound its best"', re: '\\b(?:sound|sounding)\\s+(?:its|their|your)\\s+(?:absolute\\s+)?best\\b|\\bmake\\s+your\\s+(?:music|songs?|tracks?|mix)\\s+(?:sound|shine)\\b', weight: 2 },
  { id: 'trusted-by', label: '"trusted by artists" (no names)', re: '\\btrusted\\s+by\\b', weight: 1 },
];

// Standout signals: concrete, verifiable, distinctive. Positive weights.
const STANDOUT = [
  { id: 'console', label: 'Named console or desk', re: '\\b(?:Neve\\s?(?:80\\d\\d|10\\d\\d|VR|Genesys|BCM)?|SSL\\s?(?:4000|6000|9000|Duality|AWS|Origin|G[- ]?Series|E[- ]?Series)?|API\\s?(?:1608|2448|Legacy)|Trident\\s?(?:80|88|A[- ]Range)|Harrison\\s?(?:32|4032)|Amek|MCI\\s?(?:JH|500|600)|Audient\\s?ASP|Rupert\\s+Neve|Flickinger|Helios|Cadac|Calrec|Wunder|D&R|Toft\\s?ATB)\\b', weight: 6 },
  { id: 'outboard', label: 'Named outboard gear', re: '\\b(?:LA-?2A|LA-?3A|LA-?610|1176|Distressor|Pultec|EQP-?1A|Fairchild\\s?(?:660|670)?|dbx\\s?160|Manley|Tube[- ]Tech|CL[- ]?1B|Shadow\\s+Hills|Chandler|Retro\\s+(?:176|Sta[- ]Level)|Empirical\\s+Labs|Bricasti|Lexicon\\s?(?:224|480L?|PCM)|EMT\\s?(?:140|250)|plate\\s+reverb|spring\\s+reverb|AMS\\s?(?:RMX16|DMX)|Eventide\\s?(?:H3000|H910)|Roland\\s+Space\\s+Echo|RE-?201)\\b', weight: 5 },
  { id: 'mics', label: 'Named microphones', re: '\\b(?:U\\s?-?(?:47|67|87)|C\\s?-?12|C414|ELA\\s?M\\s?251|Telefunken|Coles\\s?4038|Royer\\s?(?:121|122)?|RCA\\s?(?:44|77)|SM7B?|RE-?20|MD\\s?421|KM\\s?84|Sony\\s?C-?800G?|Brauner|Flea\\s?4[79]|Soyuz|AEA\\s?R?(?:44|84)?)\\b', weight: 5 },
  { id: 'monitors', label: 'Named monitors', re: '\\b(?:ATC\\s?SCM|Genelec|Barefoot|PMC|Amphion|Focal\\s?(?:Trio|SM9|Twin)|Yamaha\\s?NS-?10|Auratone|ProAc|Dynaudio|Neumann\\s?KH|Augspurger|Ocean\\s+Way\\s+(?:HR|monitors))\\b', weight: 4 },
  { id: 'tape', label: 'Tape machines / analog workflow', re: '\\b(?:Studer\\s?(?:A8[02]?[07]?|J37)?|Ampex\\s?(?:ATR|440)?|Otari\\s?(?:MTR|MX)?|MCI\\s+tape|2[- ]inch\\s+tape|1\\/4["″-]?\\s?(?:inch)?\\s+tape|tape\\s+machine|reel[- ]to[- ]reel)\\b', weight: 4 },
  { id: 'atmos', label: 'Immersive/Atmos specifics', re: '\\b(?:Dolby\\s+Atmos|7\\.1\\.4|9\\.1\\.[46]|immersive\\s+mix(?:ing)?\\s+(?:room|suite)|Atmos[- ]certified|spatial\\s+audio\\s+mix)\\b', weight: 4 },
  { id: 'awards', label: 'Awards & certifications', re: '\\b(?:Grammy|GRAMMY|Latin\\s+Grammy|Juno|Brit\\s+Award|Dove\\s+Award|Emmy|Oscar|Academy\\s+Award|RIAA|gold\\s+(?:record|certification|certified|album|single)|platinum\\s+(?:record|certification|certified|album|single|selling)|multi[- ]platinum|diamond\\s+certified)\\b', weight: 7 },
  { id: 'charts', label: 'Chart / streaming specifics', re: '\\b(?:Billboard\\s+(?:Hot\\s+100|200|charts?)|charted\\s+(?:at|on)|#\\s?\\d+\\s+(?:on|in|single|album|record)|No\\.\\s?\\d+\\s+(?:on|single|album|hit)|top\\s+\\d+\\s+(?:hit|single|album)|\\d+[\\s,]*(?:million|billion|M|B)\\+?\\s+streams)\\b', weight: 6 },
  { id: 'credits-page', label: 'Credits / discography language', re: '\\b(?:discograph(?:y|ies)|selected\\s+credits|full\\s+credits|credit\\s+list|album\\s+credits|as\\s+heard\\s+on)\\b', weight: 4 },
  { id: 'verified-credits', label: 'Link to verifiable credits (Discogs/AllMusic/Muso)', re: '\\b(?:discogs\\.com|allmusic\\.com|muso\\.ai|jaxsta|genius\\.com/artists)\\b', weight: 6 },
  { id: 'since-year', label: 'Established date / concrete history', re: '\\b(?:since|est\\.?|established|founded|opened)\\s+(?:in\\s+)?(?:19[5-9]\\d|20[0-2]\\d)\\b', weight: 3 },
  { id: 'count-records', label: 'Concrete numbers of records/projects', re: '\\b(?:\\d{2,}(?:,\\d{3})?\\+?)\\s+(?:records?|albums?|EPs?|singles?|releases?|projects?|songs?|mixes?)\\b', weight: 4 },
  { id: 'room-specifics', label: 'Room / acoustics specifics', re: '\\b(?:\\d{2,4}\\s?(?:sq(?:uare)?\\.?\\s?(?:ft|feet|foot)|m2|square\\s+met(?:er|re)s?)|live\\s+room|iso(?:lation)?\\s+booths?|floated\\s+floors?|control\\s+room\\s+(?:designed|built|tuned)|(?:designed|built|tuned)\\s+by\\s+[A-Z][a-z]+|Munro|Walters[- ]Storyk|WSDG|Vincent\\s+van\\s+Haaff|Francis\\s+Manzella)\\b', weight: 4 },
  { id: 'named-rooms', label: 'Historic studio pedigree', re: '\\b(?:Abbey\\s+Road|Electric\\s+Lady|Sunset\\s+Sound|Capitol\\s+Studios|Blackbird|Sound\\s+City|EastWest|United\\s+Recording|RCA\\s+Studio|Muscle\\s+Shoals|Sun\\s+Studio|Power\\s+Station|Avatar|Hit\\s+Factory|Record\\s+Plant|Criteria|Ocean\\s+Way|The\\s+Village|Sterling\\s+Sound|Bernie\\s+Grundman|Metropolis\\s+Studios|Real\\s+World)\\b', weight: 5 },
  { id: 'process', label: 'Concrete process detail (revisions, stems, delivery)', re: '\\b(?:\\d+\\s+(?:free\\s+)?revisions?|stems?\\s+(?:delivery|included|provided)|alternate\\s+(?:mixes|versions)|instrumental\\s+and\\s+a\\s?cappella|TV\\s+mix|(?:24|32)[- ]bit(?:\\s?\\/\\s?|\\s+)(?:44\\.1|48|88\\.2|96|192)\\s?k(?:Hz)?|LUFS|DDP|vinyl\\s+pre[- ]?master)\\b', weight: 4 },
  { id: 'pricing', label: 'Transparent pricing', re: '(?:[$£€]\\s?\\d{2,5}(?:[.,]\\d{2,3})?\\s*(?:\\/|per|an?\\s)?\\s*(?:hr|hour|day|song|track|mix|master|session)?|\\bday\\s+rate\\b|\\bper[- ]song\\s+rate\\b)', weight: 4 },
  { id: 'union-cert', label: 'Professional affiliations', re: '\\b(?:AES\\b|Recording\\s+Academy|P&E\\s+Wing|Producers\\s+(?:&|and)\\s+Engineers\\s+Wing|voting\\s+member|SoundGirls|Berklee|Full\\s+Sail|Abbey\\s+Road\\s+Institute)\\b', weight: 3 },
];

module.exports = { CLICHES, GENERIC, STANDOUT };
