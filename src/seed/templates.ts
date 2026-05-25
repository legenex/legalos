// Seed bodies for the 9 SharedLegalTemplate records. Each body uses {{site.*}} variables
// so the same template renders correctly across every Site.

import type { TemplateKey } from '../collections/SharedLegalTemplates'

export const TEMPLATE_BODIES: Array<{
  template_key: TemplateKey
  default_meta_title: string
  default_meta_description: string
  body_markdown_with_vars: string
}> = [
  {
    template_key: 'home',
    default_meta_title: '{{site.name}}',
    default_meta_description: 'Find out if you qualify in a few quick questions.',
    body_markdown_with_vars: `# {{site.name}}

We help people understand whether they may have a claim. Answer a few questions to see if your situation qualifies.

If you have questions, call us at {{site.phone}}.
`,
  },
  {
    template_key: 'privacy',
    default_meta_title: 'Privacy Notice | {{site.name}}',
    default_meta_description: 'How {{site.name}} collects, uses, and protects your information.',
    body_markdown_with_vars: `# Privacy Notice

Last updated: {{today}}

{{site.org_name}} ("we", "us") respects your privacy. This notice explains what information we collect when you use {{site.name}}, how we use it, and the choices you have.

## Information we collect

- Information you submit through forms and questionnaires, including name, email, phone number, state, and answers about your situation.
- Information collected automatically, such as IP address, browser type, device identifiers, pages visited, and approximate location.
- Information from third parties that help us verify lead quality and prevent fraud (for example, TrustedForm and phone verification services).

## How we use information

- To respond to your inquiry and connect you with attorneys, case managers, or partner law firms that handle matters relevant to your situation.
- To improve our services, our questionnaires, and our website.
- To comply with legal obligations and prevent fraud.

## Sharing of information

We share information with the law firms and partners we work with so they can evaluate your claim. We do not sell your information to unrelated third parties for their own marketing.

## Your choices

You may opt out of further contact at any time by replying STOP to a text message, clicking unsubscribe in any email, or contacting us at {{site.support_email}}.

## Data retention

We retain information only as long as needed to fulfill the purposes described in this notice or to meet legal obligations.

## Contact us

Questions about this notice can be sent to {{site.support_email}} or mailed to {{site.org_address}}.

Calling {{site.phone}} also reaches our team during business hours.
`,
  },
  {
    template_key: 'privacy-policy',
    default_meta_title: 'Privacy Policy | {{site.name}}',
    default_meta_description: 'The full privacy policy for {{site.name}}.',
    body_markdown_with_vars: `# Privacy Policy

Last updated: {{today}}

This Privacy Policy describes how {{site.org_name}} ("we") collects, uses, and discloses information collected through {{site.name}} and any related services.

## 1. Information we collect

**Information you provide.** When you complete a form or speak with our team you may share your name, contact details, location, and information about a potential claim.

**Information collected automatically.** We and our partners use cookies, pixel tags, and similar technologies to collect IP address, browser and device information, referring URLs, and pages visited.

**Information from third parties.** We may receive information from advertising partners, verification services (including TrustedForm and Jornaya LeadiD), and service providers.

## 2. How we use information

- Connecting you with law firms or case managers
- Verifying lead authenticity
- Communicating with you about your inquiry
- Internal analytics and product improvement
- Meeting legal and regulatory requirements

## 3. Sharing

We share information with partner law firms and service providers as needed to evaluate and pursue your inquiry. We do not sell personal information to third parties for unrelated marketing.

## 4. Your rights

Depending on where you live, you may have rights to access, correct, or delete your personal information. To exercise these rights, contact us at {{site.support_email}}.

## 5. Security

We use reasonable safeguards to protect personal information. No system is perfectly secure.

## 6. Children

This site is not directed to children under 13 and we do not knowingly collect their information.

## 7. Changes

We may update this policy. The "Last updated" date shows the most recent revision.

## 8. Contact

{{site.org_name}}
{{site.org_address}}
{{site.support_email}}
{{site.phone}}
`,
  },
  {
    template_key: 'terms',
    default_meta_title: 'Terms of Service | {{site.name}}',
    default_meta_description: 'The terms governing your use of {{site.name}}.',
    body_markdown_with_vars: `# Terms of Service

Last updated: {{today}}

These Terms govern your use of {{site.name}}, operated by {{site.org_name}}. By using this site you agree to these Terms.

## 1. No legal advice

Nothing on this site is legal advice. We are not a law firm. Submitting a form does not create an attorney-client relationship. Past results do not guarantee future outcomes.

## 2. Use of the site

You agree to use {{site.name}} only for lawful purposes and to provide accurate information when completing forms.

## 3. Communications

By providing your phone number you consent to receive calls and text messages from {{site.org_name}} and our partner law firms about your inquiry, including by automated means. Message and data rates may apply. Consent is not a condition of any purchase. You can opt out at any time by replying STOP.

## 4. Intellectual property

All content on this site is owned by {{site.org_name}} or its licensors and may not be copied without permission.

## 5. Disclaimers

The site is provided "as is" without warranties of any kind. We do not guarantee a particular result.

## 6. Limitation of liability

To the maximum extent permitted by law, {{site.org_name}} is not liable for any indirect, incidental, or consequential damages arising from your use of the site.

## 7. Changes

We may update these Terms at any time. Continued use after changes means you accept them.

## 8. Contact

Questions: {{site.support_email}} or {{site.phone}}.
`,
  },
  {
    template_key: 'partners',
    default_meta_title: 'Our Partners | {{site.name}}',
    default_meta_description: 'The law firms and partners {{site.name}} works with.',
    body_markdown_with_vars: `# Our Partners

{{site.name}} works with a network of law firms and case managers who handle matters relevant to the issues people contact us about.

We refer your inquiry to a partner firm based on the type of claim, the state where you live, and the firm's intake capacity. The firm you are matched with will be responsible for evaluating your case and deciding whether to take it on.

If you want to know which partner received your inquiry, email us at {{site.support_email}} or call {{site.phone}}.

We update this page as our partner network changes. Last reviewed: {{today}}.
`,
  },
  {
    template_key: 'submitted',
    default_meta_title: 'Thank you | {{site.name}}',
    default_meta_description: 'Your information has been received.',
    body_markdown_with_vars: `# Thanks, your information has been received.

A member of our team or one of our partner law firms will reach out shortly to discuss your situation.

**What happens next**

1. We review the information you submitted.
2. A case manager or attorney contacts you, usually within one business day.
3. If your case qualifies, they explain next steps with no obligation.

If you would like to speak with us sooner, call {{site.phone}}. We are available during business hours.

Thank you for trusting {{site.name}}.
`,
  },
  {
    template_key: 'thanks-dq',
    default_meta_title: 'Thank you | {{site.name}}',
    default_meta_description: 'Thank you for reaching out.',
    body_markdown_with_vars: `# Thank you for reaching out.

Based on the information provided, we are not able to assist with this matter at this time.

We appreciate you taking the time to share your situation. While we cannot help directly, here are a few resources that may be useful:

- Your state bar association offers a lawyer referral service that can connect you with attorneys who handle matters in your area.
- Local legal aid organizations may offer free or low-cost help if you qualify.

If your situation changes or you have a related matter you would like us to review, you are welcome to reach out again at {{site.support_email}}.
`,
  },
  {
    template_key: 'tcpa',
    default_meta_title: 'TCPA Consent | {{site.name}}',
    default_meta_description: 'TCPA consent and communication preferences for {{site.name}}.',
    body_markdown_with_vars: `# TCPA Consent

By submitting your information to {{site.name}}, you consent to be contacted by {{site.org_name}} and our partner law firms by phone (including via automated dialing systems and prerecorded messages), text message, and email at the numbers and addresses you provide, regarding your inquiry and potential legal claim.

You understand that:

- Your consent is not required to obtain services or make any purchase.
- Message and data rates may apply.
- You can opt out at any time by replying STOP to a text, by clicking unsubscribe in an email, or by emailing {{site.support_email}}.

This consent applies even if your number is listed on a state or federal Do Not Call registry.

If you have questions about this consent or wish to revoke it, contact {{site.support_email}} or call {{site.phone}}.

Last updated: {{today}}.
`,
  },
  {
    template_key: 'disclosures',
    default_meta_title: 'Advertising Disclosures | {{site.name}}',
    default_meta_description: 'Required attorney advertising disclosures for {{site.name}}.',
    body_markdown_with_vars: `# Advertising Disclosures

{{site.name}} is a marketing service operated by {{site.org_name}}. It is not a law firm and does not provide legal services or legal advice.

This site is attorney advertising. Submitting your information does not create an attorney-client relationship. Any case evaluation is performed by a licensed attorney at one of our partner law firms.

Past results do not guarantee future outcomes. Each case is different. The information on this site is general in nature and not a substitute for advice from a licensed attorney about your specific circumstances.

Hiring an attorney is an important decision and should not be based solely on advertising. Before you decide, ask the attorney to send you free written information about their qualifications and experience.

For questions about these disclosures, contact {{site.support_email}} or {{site.phone}}.

Last updated: {{today}}.
`,
  },
]
