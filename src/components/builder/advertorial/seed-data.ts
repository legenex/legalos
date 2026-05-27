// Server-safe (no React / no 'use client'): advertorial sample copy + pure
// helpers, ported verbatim from the funnel-builder artifact. Shared by the
// client builder, the auto-seed (lib/funnel-samples), and the Node seed script
// so the sample advertorials are a single source of truth.

export const genId = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export const advSlugify = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

// Default bottom CTA section - appears at the bottom of every advertorial
// preview, per brand. Edit in Brand Editor -> Bottom CTA Section.
export const advDefaultBottomSection = (brandDisplayName) => ({
  enabled: true,
  badgeText: 'FREE EVALUATION',
  badgeColor: 'auto', // 'auto' = accent color, or a hex
  headline: 'Find Out What Your Case Could Be Worth',
  subline: 'Takes 60 seconds. No obligation. Confidential.',
  uspCopy: `At {{brand.displayName}}, we analyse the details of your accident and connect you with the attorney best suited to win your case. No upfront fees. No obligation. Just a fast, free check on what your claim could be worth.`,
  primaryButtonText: 'Start My Free Evaluation',
  secondaryButtonText: 'Estimate My Claim Value',
  microCopy: 'Free Case Review · No Obligation',
  verifiedText: 'Verified by NJA-Online LLC'
});

// ---- LONG FORM #1 (Personal Story) ----
export const advBuildSampleLong1 = () => ({
  id: genId('adv'),
  title: 'The $4,200 Check That Cost Tracy $186,000',
  slug: 'the-4200-check-that-cost-her-186000',
  templateId: 'personal_story',
  defaultBrandId: 'brand_cac',
  status: 'published',
  createdAt: Date.now() - 86400000 * 14,
  updatedAt: Date.now() - 86400000 * 14,
  sections: [
    { id: genId('sec'), type: 'kicker', content: 'PERSONAL FINANCE · ACCIDENT CLAIMS' },
    { id: genId('sec'), type: 'headline', content: 'The $4,200 Check That Cost Tracy $186,000' },
    { id: genId('sec'), type: 'byline', content: 'By Sarah Mitchell · 8 min read · Updated May 2026' },
    { id: genId('sec'), type: 'lede', content: 'Tracy thought signing the insurance check was the end of her nightmare. Six weeks later her neck pain finally got a name. And she realized she had given away every cent she would ever see.' },
    { id: genId('sec'), type: 'paragraph', content: "The crash happened on a Tuesday afternoon. Tracy was sitting at a red light off Buford Highway when a delivery truck rear-ended her Honda Civic at about 30 miles per hour. She walked away. The other driver was apologetic. The police came, took a report, and within three days the truck driver's insurance company called her at home." },
    { id: genId('sec'), type: 'paragraph', content: "They were friendly. They were fast. They sent a check for $4,200 to cover the dent in her bumper and a couple of urgent care visits, and asked her to sign a release. \"It's a routine settlement,\" the adjuster said. \"Just so we can close the file.\"" },
    { id: genId('sec'), type: 'pull_quote', content: 'She signed it. She thought she was being smart by not getting a lawyer involved.' },
    { id: genId('sec'), type: 'paragraph', content: "The check cleared on a Friday. Tracy used part of it to fix her car and put the rest toward credit card debt. For about ten days she felt fine. A little stiff in the morning, sure. A bit of a headache here and there. Nothing she would call an injury. Nothing she would call a doctor about." },
    { id: genId('sec'), type: 'sub_headline', content: 'Do Not Sign Anything Yet' },
    { id: genId('sec'), type: 'paragraph', content: "If you were in a crash recently, do not sign any paperwork from the insurance company. Do not give a recorded statement over the phone. Do not accept the first offer they make, no matter how fast it arrives." },
    { id: genId('sec'), type: 'paragraph', content: "Find out what your case is actually worth first. It is free to ask. It takes about 60 seconds." },
    { id: genId('sec'), type: 'paragraph', content: "One phone call could be the difference between $4,200 and $186,400." },
    { id: genId('sec'), type: 'callout_box', content: { headline: 'Do Not Wait. Your Window Is Closing.', text: 'Every day matters in injury claims. Most states have hard deadlines after which your right to file is gone forever. Check your deadline before you make any decisions.' } },
    { id: genId('sec'), type: 'paragraph', content: "Six weeks after she signed, Tracy started having headaches she could not shake. Then numbness in her left arm. Then a kind of sharp electric pain that radiated from her neck down her spine whenever she turned her head too fast. Her physician ordered an MRI and the radiologist found two herniated discs in her cervical spine, both pressing against nerve roots." },
    { id: genId('sec'), type: 'paragraph', content: "The recommended treatment was surgical. Anterior cervical discectomy and fusion. The medical bills alone, before lost wages and before the months of physical therapy that would follow, came to an estimated $186,000." },
    { id: genId('sec'), type: 'sub_headline', content: 'The Release She Signed' },
    { id: genId('sec'), type: 'paragraph', content: "When Tracy called the insurance company in tears, they were polite. They were sympathetic. And they were unmoved. The release she had signed for $4,200 was, in plain legal terms, a final and complete waiver of any future claim against the at-fault driver or their insurer arising from the accident." },
    { id: genId('sec'), type: 'paragraph', content: "It did not matter that the injuries had not been diagnosed yet. It did not matter that the adjuster knew, statistically, that soft-tissue and disc injuries from rear-end collisions often do not present symptoms for weeks. The signature ended it." },
    { id: genId('sec'), type: 'pull_quote', content: 'Tracy wishes someone had told her that before she picked up a pen.' },
    { id: genId('sec'), type: 'paragraph', content: 'Tracy wishes someone had told her that before she picked up a pen. She did not know she had options. She did not know the insurance company was moving fast for a reason.' },
    { id: genId('sec'), type: 'paragraph', content: 'Now she does. And so do you.' },
    { id: genId('sec'), type: 'sub_headline', content: 'What She Could Have Done Differently' },
    { id: genId('sec'), type: 'paragraph', content: "There is a window after most motor vehicle accidents during which victims can, and should, get a free claim review before signing anything. It costs nothing. It is not a commitment. And it is the single biggest determinant of whether you walk away with $4,200 or with the settlement your case is actually worth." },
    { id: genId('sec'), type: 'numbered_list', content: { items: [
      "Get medical attention within 14 days, even if you feel fine. Soft-tissue and disc injuries often do not present symptoms for one to three weeks. A clean medical record from the first 14 days protects the link between the accident and any injury that surfaces later.",
      "Do not give a recorded statement to the other driver's insurance until you have spoken with a qualified attorney. They will ask leading questions. Anything you say can be used to shrink your claim.",
      'Never sign a release or accept a check that says "final" or "full and complete settlement" without an outside review. Once signed, it is binding even if your injuries get worse.',
      'Get a free case review. It costs nothing. It commits you to nothing. And it will tell you, in concrete numbers, what your case is likely worth before the insurer makes you an offer.'
    ] } },
    { id: genId('sec'), type: 'cta_inline', content: { headline: 'Find out what your case is really worth', subline: 'Free, confidential 60-second claim check. No commitment.', buttonText: 'Check My Case Now', linkType: 'quiz' } },
    { id: genId('sec'), type: 'sub_headline', content: 'How Common Is This?' },
    { id: genId('sec'), type: 'paragraph', content: "Tracy's story is more common than most people realize. {{brand.displayName}} reviews thousands of cases like hers every year. Cases where victims accepted early settlements that turned out to be a tiny fraction of what they were owed. Most never knew they had options. Most thought the insurance company was on their side." },
    { id: genId('sec'), type: 'paragraph', content: "Industry data tells the story bluntly. Claimants who go through a free case review before responding to an insurance offer settle, on average, for three to four times more than claimants who handle the claim themselves. Not because lawyers are magic. Because the system is designed for people who know it well." },
    { id: genId('sec'), type: 'paragraph', content: "If you were in a crash recently, find out what your case is worth before you decide anything. The check is free. The clock is not." },
    { id: genId('sec'), type: 'disclaimer', content: { useDefault: true } }
  ]
});

// ---- LONG FORM #2 (Investigative Listicle) ----
export const advBuildSampleLong2 = () => ({
  id: genId('adv'),
  title: 'She Got $9,400. Her Neighbor Got $214,600. Same Crash.',
  slug: 'same-crash-different-settlement',
  templateId: 'investigative',
  defaultBrandId: 'brand_cac',
  status: 'published',
  createdAt: Date.now() - 86400000 * 13,
  updatedAt: Date.now() - 86400000 * 13,
  sections: [
    { id: genId('sec'), type: 'kicker', content: 'INVESTIGATION · MVA CLAIMS' },
    { id: genId('sec'), type: 'headline', content: 'She Got $9,400. Her Neighbor Got $214,600. Same Crash.' },
    { id: genId('sec'), type: 'byline', content: 'By Daniel Park · 9 min read · Updated May 2026' },
    { id: genId('sec'), type: 'lede', content: 'Two women in the same SUV. Same crash. Same injuries on paper. One walked away with $9,400. The other walked away with $214,600. We looked at what they did differently.' },
    { id: genId('sec'), type: 'paragraph', content: "In November 2024, two women were sitting in the front of a Toyota Highlander on I-285 outside Atlanta when a box truck drifted across two lanes and hit them at highway speed. Both were taken to Grady Memorial. Both were diagnosed with whiplash, a lumbar sprain, and what the ER notes called a \"mild concussion.\"" },
    { id: genId('sec'), type: 'paragraph', content: "The driver, Patricia, settled her claim eleven weeks later for $9,400. Her passenger, Lena, who was Patricia's neighbor and the reason they were on the road that day, settled fourteen months later for $214,600." },
    { id: genId('sec'), type: 'paragraph', content: "Same crash. Same injuries on paper. Twenty-three times the settlement. Here is what happened in between." },
    { id: genId('sec'), type: 'sub_headline', content: '1. Patricia talked to the insurance adjuster. Lena did not.' },
    { id: genId('sec'), type: 'paragraph', content: "Three days after the crash, both women got a call from the truck driver's commercial insurance carrier. The same adjuster called both of them. Patricia picked up. She was friendly. She explained what happened, walked through her injuries, and said the words that would later cost her: \"I feel pretty okay, actually. Just sore.\"" },
    { id: genId('sec'), type: 'paragraph', content: "That call was recorded. It became Exhibit A in every conversation about her claim from that moment forward. When her neck pain got worse over the following weeks, when she started having migraines, when an MRI six weeks later showed a herniated disc, the insurer's lawyers had a recording of her saying she felt fine." },
    { id: genId('sec'), type: 'paragraph', content: 'Lena did not pick up. She let it go to voicemail. The next day she got a free case review through {{brand.displayName}}. From that point on, every communication with the insurer went through her attorney.' },
    { id: genId('sec'), type: 'callout_box', content: { headline: 'Why this matters', text: 'Recorded statements taken in the first 7-10 days after a crash are designed to lock you into a story before you know what your injuries actually are. The adjuster is trained. You are not.' } },
    { id: genId('sec'), type: 'sub_headline', content: '2. Patricia accepted the first offer. Lena waited.' },
    { id: genId('sec'), type: 'paragraph', content: "Within two weeks, Patricia received a settlement offer of $9,400. The cover letter called it a \"prompt resolution offer.\" The adjuster on the phone called it \"the best we can do given the documented injuries.\" Patricia signed because rent was due and her car was still in the shop." },
    { id: genId('sec'), type: 'paragraph', content: "Lena got the same offer the same week. Her attorney sent it back without a response and asked for the truck driver's logbook, the dashcam footage, and the carrier's training records. Three months later the offer was $48,000. Six months later it was $112,000. Fourteen months later it settled at $214,600." },
    { id: genId('sec'), type: 'pull_quote', content: 'The first offer is almost never the real offer. It is the floor, not the ceiling.' },
    { id: genId('sec'), type: 'sub_headline', content: '3. Patricia did not document her ongoing treatment. Lena did.' },
    { id: genId('sec'), type: 'paragraph', content: "Both women had injuries that got worse, not better, over the following months. Patricia stopped going to her chiropractor after four visits because her insurance hassled her about pre-authorization and she could not afford the out-of-pocket cost. Lena's attorney connected her with a medical lien provider that covered every visit upfront." },
    { id: genId('sec'), type: 'paragraph', content: 'By the time the cases were settled, Patricia had four visits documented in her medical record. Lena had eighty-seven. In injury law, documentation is leverage. The fewer records, the smaller the settlement.' },
    { id: genId('sec'), type: 'sub_headline', content: '4. Patricia did not know about loss of earning capacity. Lena did.' },
    { id: genId('sec'), type: 'paragraph', content: "Patricia was a hairstylist. After the crash she could not stand on her feet for more than three hours without numbness shooting down her right leg. She cut her hours, lost clients, and eventually took a desk job that paid 40 percent less. She thought her settlement covered \"lost wages\" so she didn't bring it up." },
    { id: genId('sec'), type: 'paragraph', content: 'It did not. \"Lost wages\" in her release covered the four days she missed in the week of the crash. The 40 percent pay cut, the loss of future earning capacity over her remaining 30 years of work life, was a separate category of damages. Lena, who was a paralegal, included it. Her settlement reflected it.' },
    { id: genId('sec'), type: 'cta_inline', content: { headline: 'See what your case is really worth', subline: 'Same situation, very different outcomes. Find out which side you are on.', buttonText: 'Get My Free Case Check', linkType: 'quiz' } },
    { id: genId('sec'), type: 'sub_headline', content: '5. Patricia signed a general release. Lena signed a targeted one.' },
    { id: genId('sec'), type: 'paragraph', content: 'This one is the most important. Patricia signed a "general release" which closed not just the truck driver\'s liability, but also any claim against the trucking company, the company that owned the trailer, the company that loaded the cargo, and the dispatcher. Lena did not sign that. Her attorney negotiated separate settlements with three of those parties on top of the driver\'s policy.' },
    { id: genId('sec'), type: 'paragraph', content: 'The original truck driver had a $100,000 personal policy. The trucking company had a $1 million commercial policy. The cargo loader had a $500,000 policy. Most people never know that more than one policy can apply.' },
    { id: genId('sec'), type: 'sub_headline', content: 'What you can do in the next 60 seconds' },
    { id: genId('sec'), type: 'paragraph', content: "If you were in a crash and you have not signed anything yet, do not sign anything yet. If you have given a recorded statement, write down what you said. If you have an offer on the table, do not accept it until you have a second opinion." },
    { id: genId('sec'), type: 'paragraph', content: "A free case check takes about 60 seconds. It costs nothing. It commits you to nothing. It will tell you, in real numbers, whether the offer in front of you is closer to Patricia's $9,400 or Lena's $214,600." },
    { id: genId('sec'), type: 'disclaimer', content: { useDefault: true } }
  ]
});

// ---- LONG FORM #3 (Whistleblower) ----
export const advBuildSampleLong3 = () => ({
  id: genId('adv'),
  title: 'I Worked Insurance Claims for 11 Years. These Are the Phrases I Was Trained to Use.',
  slug: 'adjusters-script-three-phrases',
  templateId: 'whistleblower',
  defaultBrandId: 'brand_cac',
  status: 'published',
  createdAt: Date.now() - 86400000 * 15,
  updatedAt: Date.now() - 86400000 * 15,
  sections: [
    { id: genId('sec'), type: 'kicker', content: 'INDUSTRY EXPOSÉ · CLAIMS ADJUSTER SPEAKS OUT' },
    { id: genId('sec'), type: 'headline', content: 'I Worked Insurance Claims for 11 Years. These Are the Phrases I Was Trained to Use.' },
    { id: genId('sec'), type: 'byline', content: 'By a former senior claims adjuster · 9 min read · Identity withheld' },
    { id: genId('sec'), type: 'lede', content: 'I left the industry in 2024. What I am about to share is not illegal. It is just how the system is designed to work. And it is designed to work against you.' },
    { id: genId('sec'), type: 'callout_box', content: { headline: 'Why I am writing this anonymously', text: 'I signed an NDA. So I cannot name names. But everything in this article I learned in actual training sessions at one of the largest auto insurers in the country. None of it is a secret. None of it is illegal. All of it is built to save the company money on every claim that crosses an adjuster\'s desk.' } },
    { id: genId('sec'), type: 'paragraph', content: "I was hired right out of college. Twenty-two years old. Business degree. They sent me to six weeks of paid training before I ever spoke to a claimant. The first thing they teach you is the number. Eighty percent. That is the percentage of accident claims that close for the first offer the adjuster makes. The training literally calls this number out, in the slide deck, on day one. Eighty percent will say yes to whatever number we open with." },
    { id: genId('sec'), type: 'paragraph', content: "Our job, then, was to make sure that first offer was the lowest one we could justify. Not the lowest one we could get away with legally. The lowest one we could defend on paper if the claim ever went to a supervisor review. Those two numbers are very different." },
    { id: genId('sec'), type: 'sub_headline', content: 'The Three Phrases' },
    { id: genId('sec'), type: 'paragraph', content: 'There are three phrases I was trained to use on every call with a claimant. They are deliberate. They are tested. And once you know them, you cannot un-hear them.' },
    { id: genId('sec'), type: 'numbered_list', content: { items: [
      '"How are you holding up?" This is the icebreaker. It sounds caring. It is designed to get you talking informally, off-script, before you realize the call is being recorded. Anything you say in the first two minutes, and especially anything that minimizes how you are feeling, will be quoted back to you for the next twelve months. The right answer is "I am not prepared to discuss my injuries on the phone."',
      '"We just want to close this out for you." This frames a fast lowball offer as a favor. It positions us, the insurance company, as the helpful party who is working to make your stress go away. The implicit message is that delays are your problem, not ours. In reality, delays cost the company money. Fast closes save the company money. That phrase exists to flip the math in your head.',
      '"Going through an attorney will only slow this down." This one is the cleanest lie. The published claims data, including data the insurance industry itself collects, shows that represented claimants settle for three to four times more than unrepresented claimants on average. It is true that representation can take longer. It is also true that a settlement that is four times larger is worth waiting for.'
    ] } },
    { id: genId('sec'), type: 'pull_quote', content: 'Our job was to make sure the first offer was the lowest one we could justify.' },
    { id: genId('sec'), type: 'sub_headline', content: 'The Recorded Statement' },
    { id: genId('sec'), type: 'paragraph', content: "Within 72 hours of a crash, before a claimant has any idea what their injuries actually are, the adjuster requests a recorded statement. Most claimants agree because the adjuster sounds friendly and the request sounds reasonable. The legal purpose of that recording is to lock the claimant into a story that can be used against them when their medical picture changes." },
    { id: genId('sec'), type: 'paragraph', content: 'In my eleven years I never once took a recorded statement that helped a claimant. Not once. The statements that helped them were the ones they never gave.' },
    { id: genId('sec'), type: 'sub_headline', content: 'The "Routine Settlement" Letter' },
    { id: genId('sec'), type: 'paragraph', content: 'About two to three weeks after the crash, we would send what the company internally called a "Routine Resolution Offer." It looked official. It had numbers on it. It was framed as something every claim received as a matter of policy. The number was almost always between $3,000 and $8,000 regardless of the severity of the crash.' },
    { id: genId('sec'), type: 'paragraph', content: "The number was calibrated to be enough money that someone with rent due or a car in the shop would feel relief signing it, but not enough money to ever cover real injuries. Our internal data showed that about 60 percent of claimants signed those offers without negotiating. The other 40 percent we worked on over the following months." },
    { id: genId('sec'), type: 'callout_box', content: { headline: 'A note on the math', text: 'The "Routine Resolution Offer" amount has almost nothing to do with the value of your claim. It has almost everything to do with what the company has learned, statistically, will get a signature from a stressed person who is not represented by an attorney.' } },
    { id: genId('sec'), type: 'sub_headline', content: 'What Actually Changes The Math' },
    { id: genId('sec'), type: 'paragraph', content: 'Three things move a claim out of the Routine Resolution Offer bucket and into a real settlement number.' },
    { id: genId('sec'), type: 'paragraph', content: "First, documented medical treatment. Every visit, every diagnosis, every imaging study becomes a line item the adjuster has to account for. Adjusters work off spreadsheets. The more lines on yours, the more they have to justify a low number to a supervisor." },
    { id: genId('sec'), type: 'paragraph', content: "Second, representation. The moment an attorney's letter of representation arrives on an adjuster's desk, the claim moves from the \"routine\" workflow to the \"litigation pending\" workflow. The internal incentives change. The number changes." },
    { id: genId('sec'), type: 'paragraph', content: "Third, time. Insurance companies pay actuaries a lot of money to model the cost of resolving claims fast versus slow. The math almost always favors fast for the company. That means delay favors the claimant. The longer you take to sign, the more pressure the adjuster is under to raise the offer." },
    { id: genId('sec'), type: 'cta_inline', content: { headline: 'Stop the adjuster game.', subline: 'Free case review. 60 seconds. No commitment.', buttonText: 'Check My Case Now', linkType: 'quiz' } },
    { id: genId('sec'), type: 'sub_headline', content: 'Why I Am Writing This' },
    { id: genId('sec'), type: 'paragraph', content: 'My second-to-last week on the job, I worked a claim for a woman whose teenage son had been a passenger in a friend\'s car that was rear-ended at a stop sign. The son had a broken collarbone and a concussion. I knew, looking at the file, that the case was worth between $80,000 and $120,000. I was authorized to offer her $12,500.' },
    { id: genId('sec'), type: 'paragraph', content: "She signed. She thanked me. She told me I had been so kind to her family during a hard time. I closed the file. I hit my quarterly metric. I went home and could not sleep." },
    { id: genId('sec'), type: 'paragraph', content: 'I left the industry six weeks later. I am writing this because nobody told that woman what she did not know. And nobody is going to tell you either. Unless you ask.' },
    { id: genId('sec'), type: 'disclaimer', content: { useDefault: true } }
  ]
});

// ---- SHORT FORM #1 (Personal Story) ----
export const advBuildSampleShort1 = () => ({
  id: genId('adv'),
  title: 'Why Skipping the ER Cost This Driver $42,000',
  slug: 'the-14-day-rule-most-victims-miss',
  templateId: 'personal_story',
  defaultBrandId: 'brand_cac',
  status: 'published',
  createdAt: Date.now() - 86400000 * 14,
  updatedAt: Date.now() - 86400000 * 14,
  sections: [
    { id: genId('sec'), type: 'kicker', content: 'INSURANCE CLAIMS' },
    { id: genId('sec'), type: 'headline', content: 'Why Skipping the ER Cost This Driver $42,000' },
    { id: genId('sec'), type: 'byline', content: 'By Marcus Reilly · 3 min read · Updated May 2026' },
    { id: genId('sec'), type: 'lede', content: 'He felt fine at the scene. He drove himself home. That single decision shrank his settlement by tens of thousands.' },
    { id: genId('sec'), type: 'paragraph', content: 'When James was rear-ended on the 405, he was annoyed but not hurt. He waved off the paramedics, exchanged information with the other driver, and drove home. Two days later his back was so tight he could barely stand up from his desk chair.' },
    { id: genId('sec'), type: 'callout_box', content: { headline: 'The 14-Day Rule', text: 'Insurance adjusters look for one thing first: did you seek medical attention within 14 days of the crash? If not, they will argue your injuries are unrelated to the accident.' } },
    { id: genId('sec'), type: 'paragraph', content: 'By the time James saw a doctor, eight days had passed. The diagnosis was a lumbar strain. Real, painful, and ultimately requiring six months of physical therapy. But the gap between the crash and the visit gave the insurer all the leverage they needed. His final settlement came in $42,000 below what comparable cases settled for.' },
    { id: genId('sec'), type: 'paragraph', content: "If you were in a crash recently and you have not seen a doctor yet, see one today. Even if you feel fine. And before you accept any offer from the insurance company, find out what your case is actually worth. It takes 60 seconds." },
    { id: genId('sec'), type: 'cta_inline', content: { headline: 'See what your case is really worth', subline: 'Free 60-second case check. No commitment.', buttonText: 'Check My Case', linkType: 'quiz' } },
    { id: genId('sec'), type: 'disclaimer', content: { useDefault: true } }
  ]
});

// ---- SHORT FORM #2 (Personal Story) ----
export const advBuildSampleShort2 = () => ({
  id: genId('adv'),
  title: 'The Settlement Letter That Sat on Their Fridge for Three Weeks',
  slug: 'offer-letter-on-fridge',
  templateId: 'personal_story',
  defaultBrandId: 'brand_cac',
  status: 'published',
  createdAt: Date.now() - 86400000 * 10,
  updatedAt: Date.now() - 86400000 * 10,
  sections: [
    { id: genId('sec'), type: 'kicker', content: 'ACCIDENT CLAIMS' },
    { id: genId('sec'), type: 'headline', content: 'The Settlement Letter That Sat on Their Fridge for Three Weeks' },
    { id: genId('sec'), type: 'byline', content: 'By Anna Lopez · 3 min read' },
    { id: genId('sec'), type: 'lede', content: "The offer arrived eleven days after the crash. It sat on their fridge for three weeks. That delay is the only reason they did not lose $63,000." },
    { id: genId('sec'), type: 'paragraph', content: 'Mike and Donna had been hit by a distracted driver on a Saturday morning grocery run. Both had whiplash. Donna had a wrist sprain. The insurance company moved fast. Within two weeks they had an offer in their mailbox for $7,800.' },
    { id: genId('sec'), type: 'paragraph', content: 'It looked official. It said "Final Settlement Offer" at the top. The cover letter said the offer would expire in 30 days. So they stuck it on the fridge under a magnet and tried to figure out what to do.' },
    { id: genId('sec'), type: 'callout_box', content: { headline: 'Why the deadline did not matter', text: 'Insurance "final offer" deadlines are almost always negotiable. The deadline is a pressure tactic, not a legal requirement. The actual statute of limitations on most MVA claims is one to four years.' } },
    { id: genId('sec'), type: 'paragraph', content: "Three weeks in, Donna got a free case review through {{brand.displayName}}. She filled it out while Mike was at work. The review came back the next day. Their case, based on the medical records they had already accumulated and the lost work time, was likely worth between $60,000 and $80,000." },
    { id: genId('sec'), type: 'paragraph', content: "They tore up the $7,800 offer. Eight months later they settled for $70,800." },
    { id: genId('sec'), type: 'cta_inline', content: { headline: 'Got a settlement offer? Get a second opinion first.', subline: 'Free. 60 seconds. No commitment.', buttonText: 'Check My Case', linkType: 'quiz' } },
    { id: genId('sec'), type: 'disclaimer', content: { useDefault: true } }
  ]
});

// ---- SHORT FORM #3 (News Authority) ----
export const advBuildSampleShort3 = () => ({
  id: genId('adv'),
  title: "The Phone Call Insurance Companies Pray You'll Take",
  slug: 'the-call-they-want-you-to-take',
  templateId: 'news_authority',
  defaultBrandId: 'brand_cac',
  status: 'published',
  createdAt: Date.now() - 86400000 * 8,
  updatedAt: Date.now() - 86400000 * 8,
  sections: [
    { id: genId('sec'), type: 'kicker', content: 'CONSUMER ALERT' },
    { id: genId('sec'), type: 'headline', content: "The Phone Call Insurance Companies Pray You'll Take" },
    { id: genId('sec'), type: 'dateline', content: 'NEW YORK · May 2026' },
    { id: genId('sec'), type: 'lede', content: 'It usually comes within 72 hours of the crash. The number is unfamiliar. The voice on the other end is calm and friendly. And it is the most expensive phone call most accident victims will ever answer.' },
    { id: genId('sec'), type: 'paragraph', content: 'The Insurance Research Council reports that more than 80 percent of motor vehicle accident claimants give a recorded statement to the at-fault driver\'s insurance carrier within the first week of the crash. Most do so because the adjuster sounds reasonable. Most do not realize the statement is recorded. Most have no idea what their injuries actually are yet.' },
    { id: genId('sec'), type: 'stat_block', content: { value: '3.5x', label: 'Average settlement multiplier when the claimant uses an attorney instead of speaking directly with the adjuster', source: 'Source: Insurance Research Council, 2024' } },
    { id: genId('sec'), type: 'paragraph', content: 'The first recorded statement is the single most powerful document in a defense file. Attorneys for the insurance company will return to it for the entire life of the claim. Any sentence that minimizes how the claimant feels at the time of the call, including the words "I think I am okay" or "It was not too bad," becomes evidence that any later medical claims are exaggerated.' },
    { id: genId('sec'), type: 'paragraph', content: 'Legal experts interviewed for this article agreed on one piece of advice. Do not take the call. Or if you do, do not give a statement.' },
    { id: genId('sec'), type: 'cta_inline', content: { headline: 'Find out what your case is really worth', subline: 'Free case review. No phone call. No commitment.', buttonText: 'Check My Case Now', linkType: 'quiz' } },
    { id: genId('sec'), type: 'disclaimer', content: { useDefault: true } }
  ]
});

export const advBuildSeedAdvertorials = () => [
  advBuildSampleLong1(), advBuildSampleLong2(), advBuildSampleLong3(),
  advBuildSampleShort1(), advBuildSampleShort2(), advBuildSampleShort3()
];
