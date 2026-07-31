/**
 * Assertions for the brand-extraction scoring rules.
 *
 * The repo has no test runner, so this is standalone: it imports the pure
 * scorer, asserts against synthetic samples, and exits non-zero on failure.
 *
 *   node --experimental-strip-types scripts/test-brand-extract.ts
 *
 * The scorer is deliberately importable without Playwright, which is what lets
 * the hard part - deciding whether a reading is a brand colour or a framework
 * default - be checked without launching a browser. Several of these encode
 * bugs that reached the server: a flat pixel floor that rejected the very hero
 * button it was written to find, and a neutrality test that could not tell
 * Tailwind's grey from a real brand navy.
 */
import { applyRejections, proposeTokens, proposeFonts, isGrey, isNeutralExtreme, MIN_COUNT, MIN_PIXEL_SHARE } from '../src/lib/brand/extract-score.ts'
let p=0,f=0; const t=(c:unknown,l:string)=>{c?p++:(f++,console.log('  FAIL '+l))}
const S=(o:any)=>({count:5,pixelShare:0.1,source:'s',...o})

// --- neutral detection ------------------------------------------------------
t(isNeutralExtreme('#ffffff'),'white is a neutral extreme')
t(isNeutralExtreme('#000000'),'black is a neutral extreme')
t(isNeutralExtreme('#fdfdfd'),'near-white is a neutral extreme')
t(!isNeutralExtreme('#c2410c'),'a brand orange is not')
t(isGrey('#808080'),'mid grey is grey')
t(!isGrey('#252e39'),'a desaturated navy is a COLOUR - calling it grey would discard a real brand')
t(isGrey('#6b7280'),'Tailwind grey-500 is grey, despite spanning the same channel range as that navy')
t(isGrey('#1c1917'),'a near-black ink is grey')
t(!isGrey('#c2410c'),'orange is not grey')

// --- rejection rules --------------------------------------------------------
const r1 = applyRejections([S({role:'link',color:'#c2410c',count:1})])
t(r1.kept.length===0 && /needs 2/.test(r1.rejected[0].reason),'a link seen once is rejected, with the count in the reason')

const r2 = applyRejections([S({role:'cta',color:'#c2410c',pixelShare:0.001})])
t(r2.kept.length===0 && /covers 0.10%/.test(r2.rejected[0].reason),'a colour covering too little is rejected, and says how little')

const r3 = applyRejections([S({role:'ink',color:'#1c1917',pixelShare:0.0001})])
t(r3.kept.length===1,'body text is exempt from the pixel floor - it legitimately covers very little')

const r4 = applyRejections([S({role:'page_bg',color:'#fffbf5',count:1,pixelShare:1})])
t(r4.kept.length===1,'the page background is exempt from the count floor - there is only one')

const r5 = applyRejections([S({role:'cta',color:'rgba(0,0,0,0)'})])
t(r5.kept.length===0,'an unresolvable colour is rejected')

// --- the property this whole rebuild exists for -----------------------------
// A Tailwind site whose real brand is orange. The OLD extractor returned
// slate/orange-600 from declaration order; this one must follow what was painted.
const dontSettle = applyRejections([
  S({role:'cta',   color:'#c2410c', pixelShare:0.03, source:'largest above-fold button'}),
  S({role:'logo',  color:'#c2410c', pixelShare:0.05, source:'header logo'}),
  S({role:'page_bg',color:'#fffbf5', pixelShare:1}),
  S({role:'surface',color:'#ffffff', pixelShare:0.4}),
  S({role:'ink',   color:'#1c1917', pixelShare:0.02}),
]).kept
const tok = proposeTokens(dontSettle)
t(tok.cta?.value==='#c2410c','the CTA colour comes from the button that was actually painted')
t(tok.primary?.value==='#c2410c','primary follows the CTA')
t(tok.bg?.value==='#fffbf5','the ground is the real page background, not a framework slate')
t(tok.surface?.value==='#ffffff','the card surface is read separately from the ground')
t(tok.ink?.value==='#1c1917','ink is the real text colour')
t(!Object.values(tok).some(v=>v.value==='#ea580c'),'orange-600 does not appear - nothing invents a framework default')
t(!Object.values(tok).some(v=>v.value==='#1e293b'),'slate-800 does not appear either')

// corroboration raises confidence
t(tok.cta.confidence > 0.8,'a colour corroborated by the logo scores high')
const lonely = proposeTokens(applyRejections([S({role:'link',color:'#0000ee',pixelShare:0.05})]).kept)
t((lonely.accent?.confidence ?? 1) < 0.4,'a link-only colour scores low, because links are usually a framework default')

// --- a grey brand is reported as no brand, not as grey ----------------------
const greyish = proposeTokens(applyRejections([
  S({role:'cta',color:'#6b7280',pixelShare:0.03}),
  S({role:'page_bg',color:'#ffffff',pixelShare:1}),
]).kept)
t(!greyish.primary,'a grey CTA yields no primary - finding no brand is stated, not papered over')

// The rules that nearly rejected what they exist to find.
const soloCta = applyRejections([S({role:'cta',color:'#c2410c',count:1,pixelShare:0.009})])
t(soloCta.kept.length===1,'a single hero CTA survives - one is the normal number, not too few')
const smallCta = applyRejections([S({role:'cta',color:'#c2410c',count:1,pixelShare:0.0004})])
t(smallCta.kept.length===0,'a badge-sized CTA is still rejected as too small to be an area of brand')
t(/covers 0.04%/.test(smallCta.rejected[0].reason),'the rejection states the measurement, so an operator can act on it')
const oneCard = applyRejections([S({role:'surface',color:'#eef2ff',count:1,pixelShare:0.2})])
t(oneCard.kept.length===0,'a single card background is rejected - a surface earns its place by recurring')
t(greyish.bg?.value==='#ffffff','the ground is still reported')

// --- evidence survives ------------------------------------------------------
t(/button/.test(tok.cta.source),'each token carries the evidence it came from')

// --- fonts ------------------------------------------------------------------
const fonts = proposeFonts([
  {role:'heading',family:'"Playfair Display", Georgia, serif',count:4},
  {role:'body',family:'system-ui, -apple-system, sans-serif',count:1},
])
t(fonts.font_heading?.value==='Playfair Display','the heading family is taken and unquoted')
t(!fonts.font_body,'a generic system stack is not proposed as a brand font')



// --- the real dontsettle.co reading, as a regression guard ------------------
const ds = proposeTokens(applyRejections([
  S({role:'cta',     color:'#2b867a', count:1, pixelShare:0.018}),
  S({role:'accent',  color:'#c0a848', count:2, pixelShare:0.011}),
  S({role:'logo',    color:'#c0a848', count:1, pixelShare:0}),
  S({role:'page_bg', color:'#f6f9f8', count:1, pixelShare:1}),
  S({role:'surface', color:'#ffffff', count:13, pixelShare:0.2}),
  S({role:'ink',     color:'#0d242a', count:9, pixelShare:0.04}),
]).kept)
t(ds.primary?.value==='#2b867a','dontsettle primary is the teal claim button')
t(ds.accent?.value==='#c0a848','dontsettle accent is the gold from the logo')
t(ds.bg?.value==='#f6f9f8' && ds.ink?.value==='#0d242a','dontsettle ground and ink are the light pair, as measured')
t(!Object.values(ds).some(v=>['#c2410c','#1e293b','#334155'].includes(v.value)),
  'no Tailwind default appears anywhere - the reason this was rebuilt')
t(ds.accent!.confidence < ds.primary!.confidence,'the logo-derived accent is reported less confidently than the button')

console.log(`\n${p} passed, ${f} failed`); if(f) process.exit(1)
