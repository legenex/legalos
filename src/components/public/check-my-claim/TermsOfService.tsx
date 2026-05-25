'use client'

import { DocModalPage, NoWinNoFeeCard } from './_shared'

const ink = '#111E30'
const muted = '#595E64'
const link = '#0285E9'

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-[1.5rem] font-bold mt-8 mb-4" style={{ color: ink }}>
    {children}
  </h2>
)

const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[1.125rem] font-semibold mt-4 mb-2" style={{ color: ink }}>
    {children}
  </h3>
)

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-4" style={{ color: muted, lineHeight: 1.625 }}>
    {children}
  </p>
)

export default function TermsOfService() {
  return (
    <DocModalPage title="Terms of Service">
      <P>
        These Terms and Conditions (&ldquo;Terms&rdquo;) govern your use of the Check my Claim website (the
        &ldquo;Website&rdquo;), owned and operated by NJA-Online LLC. By accessing or using the Website, you agree to
        be bound by these Terms.
      </P>

      <H2>1. User Responsibilities</H2>
      <H3>1.1 Eligibility</H3>
      <P>You must be at least 18 years old to use this Website.</P>
      <H3>1.2 Account Registration</H3>
      <P>
        You agree to provide accurate, current, and complete information about yourself, and to maintain the
        confidentiality of any account credentials you create.
      </P>
      <H3>1.3 Compliance with Laws</H3>
      <P>You agree to use the Website in compliance with all applicable laws and regulations.</P>

      <H2>2. Intellectual Property</H2>
      <H3>2.1 Ownership</H3>
      <P>
        All content on the Website, including text, graphics, logos, and software, is owned by NJA-Online LLC or its
        licensors and is protected by copyright and other intellectual property laws.
      </P>
      <H3>2.2 Limited License</H3>
      <P>
        We grant you a limited, non-exclusive, non-transferable license to access and use the Website for your
        personal, non-commercial use only.
      </P>

      <H2>3. Privacy and Data Sharing</H2>
      <H3>3.1 Privacy Policy</H3>
      <P>
        Our collection and use of your personal information is governed by our Privacy Policy, which is incorporated
        into these Terms by reference.
      </P>
      <H3>3.2 Data Sharing</H3>
      <P>
        Information collected on the Website, including your phone number, may be shared with Twilio and other mobile
        operators for the purpose of delivering messages and calls related to your inquiry.
      </P>

      <H2>4. Disclaimers and Limitations of Liability</H2>
      <H3>4.1 No Legal Advice</H3>
      <P>
        The information provided on the Website is for general informational purposes only and does not constitute
        legal advice.
      </P>
      <H3>4.2 No Guarantee of Results</H3>
      <P>
        We do not guarantee any specific outcome or settlement from the use of our services or the services of any
        attorney to whom you may be connected.
      </P>
      <H3>4.3 Limitation of Liability</H3>
      <P>
        To the maximum extent permitted by law, NJA-Online LLC will not be liable for any indirect, incidental,
        consequential, or punitive damages arising from your use of the Website.
      </P>

      <H2>5. Termination</H2>
      <P>
        We may suspend or terminate your access to the Website at any time, with or without notice, for any reason.
      </P>

      <H2>6. Communications Consent</H2>
      <P>
        By submitting your information, you consent to receive calls, text messages, and emails from Accident
        Compensation Experts and its affiliated partners regarding your inquiry. Your number may be shared with
        Twilio and other communications partners to facilitate these messages. This consent applies even if your
        number is registered on a federal, state, or internal Do Not Contact list. Your consent is not a condition of
        any purchase.
      </P>

      <H2>7. Severability</H2>
      <P>
        If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain
        in full force and effect.
      </P>

      <H2>8. Governing Law and Jurisdiction</H2>
      <P>
        These Terms are governed by the laws of the United States. Any disputes arising under or in connection with
        these Terms will be resolved in the courts located in the United States.
      </P>

      <H2>9. Changes to the Terms</H2>
      <P>
        We reserve the right to modify these Terms at any time. The updated Terms will be posted on the Website with
        a new effective date.
      </P>

      <H2>10. Contact Us</H2>
      <P>
        If you have any questions about these Terms, please contact us at:{' '}
        <a
          href="mailto:help@checkmyclaim.co"
          className="font-semibold hover:underline"
          style={{ color: link }}
        >
          help@checkmyclaim.co
        </a>
      </P>

      <div className="mt-8">
        <NoWinNoFeeCard />
      </div>
    </DocModalPage>
  )
}
