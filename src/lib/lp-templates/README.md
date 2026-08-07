# The twelve landing-page templates

Generated from the design handoff by `scripts/extract-lp-templates.mjs`. Do not
edit the `.ts` files by hand - re-run the extractor, or the code and the design
drift apart with nothing to detect it.

    node scripts/extract-lp-templates.mjs review

The reference folder is not committed: it is 18MB of self-contained artifact
bundles and it is a source, not a build input the app needs at runtime. Keep it
wherever you like and pass the path.

## Why the markup is carried over rather than rebuilt

The requirement is pixel parity. The references style every element INLINE -
there is not one CSS class in any of the twelve - so each value is explicit on
the element that uses it and can be ported exactly. Rebuilding the same designs
through a generic renderer would mean re-deriving hundreds of measurements from
screenshots, which is how the first attempt at this ended up structurally right
and dimensionally approximate.

## What the extractor changes, and nothing else

It removes the handoff's own chrome - the dark toolbar and the annotation
strips, which the design marks for us with `display:{{anno}}` - and it turns
every colour into a token that keeps the original as its CSS fallback:

    #f7f7f7   ->   var(--lp-n963, #f7f7f7)

That fallback is the point. Rendered with no variables supplied, the output is
the reference. Supply them and the same markup recolours to a brand, which is
what the handoff means by "attach a brand and it recolors through the token
system".

Tokens are named by luminance, so `--lp-n963` is a colour at 0.963 relative
luminance. Naming them that way keeps a template's greys in their exact order
and spacing when they are remapped, and it is that ladder which carries the
contrast the design was drawn with. Saturated colours are named separately
(`--lp-accent`) because they are brand accents rather than rungs on the ladder.

## Verified

`editorial_investigation_v2` was diffed against its reference element by
element: 214 elements in both, every colour identical, every font size and
weight identical, every block origin identical. The residual difference is text
WIDTH - 201px against 194px, and a section 59px shorter overall - which is font
metrics rather than the port: the reference serves bundled variable Archivo at
`font-stretch:100%` and the comparison harness served Google's default axes.
Closing that is a font-loading fix, not a markup fix.

The other eleven have been extracted but not yet diffed.
