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

const UL = ({ children }: { children: React.ReactNode }) => (
  <ul className="list-disc pl-6 mb-4 flex flex-col gap-2" style={{ color: muted, lineHeight: 1.625 }}>
    {children}
  </ul>
)

export default function PrivacyPolicy() {
  return (
    <DocModalPage title="Privacy Policy">
      <P>
        This privacy policy (&ldquo;Policy&rdquo;) applies to the personal information collected by NJA-Online LLC
        (&ldquo;we&rdquo; or &ldquo;us&rdquo;) through the checkmyclaim.co website (&ldquo;Website&rdquo;). We are
        committed to protecting your privacy and handling your personal information in accordance with applicable data
        protection laws.
      </P>

      <H2>Information We Collect</H2>
      <P>We may collect the following types of personal information from you:</P>
      <H3>Contact Information</H3>
      <P>name, email address, phone number, and mailing address.</P>
      <H3>Personal Information</H3>
      <P>
        information related to your accident or injury, including but not limited to the date and location of the
        accident, the extent of your injuries, and any medical treatment you received.
      </P>
      <H3>Other Information</H3>
      <P>
        we may also collect other information you provide to us, such as when you submit a question or request through
        our online contact form.
      </P>

      <H2>How We Use Your Information</H2>
      <P>We may use your personal information for the following purposes:</P>
      <UL>
        <li>To respond to your inquiries and requests.</li>
        <li>To provide you with information about our services and other relevant information.</li>
        <li>To improve our Website and services.</li>
        <li>To comply with legal and regulatory requirements.</li>
      </UL>

      <H2>How We Share Your Information</H2>
      <H3>Our service providers</H3>
      <P>
        We may share your personal information with third-party service providers that assist us in providing our
        services.
      </P>
      <H3>Legal requirements</H3>
      <P>
        We may disclose your personal information to comply with applicable laws, regulations, legal processes, or
        government requests.
      </P>

      <H2>Your Rights</H2>
      <P>You have the right to:</P>
      <UL>
        <li>Access your personal information.</li>
        <li>Correct any errors in your personal information.</li>
        <li>Object to the processing of your personal information.</li>
        <li>Delete your personal information.</li>
        <li>Restrict the processing of your personal information.</li>
        <li>Withdraw your consent to the processing of your personal information.</li>
      </UL>
      <P>If you wish to exercise any of these rights, please contact us using the contact information below.</P>

      <H2>Security</H2>
      <P>
        We take reasonable measures to protect your personal information from unauthorized access, use, or disclosure.
        However, we cannot guarantee the security of your personal information.
      </P>

      <H2>Links to Third-Party Websites</H2>
      <P>
        Our Website may contain links to third-party websites. We are not responsible for the privacy practices or
        content of these third-party websites.
      </P>

      <H2>Changes to the Policy</H2>
      <P>
        We reserve the right to change this Policy at any time. We will notify you of any material changes to this
        Policy by posting the updated Policy on our Website.
      </P>

      <H2>California Privacy Rights</H2>
      <P>
        If you are a California resident, you have the right to request information about our collection, use, and
        disclosure of your personal information over the past 12 months.
      </P>
      <P>
        You also have the right to request the deletion of personal information we have collected from you, subject to
        certain exceptions.
      </P>
      <P>
        To exercise any of these rights, please contact us using the information in the &ldquo;Contact Us&rdquo;
        section below.
      </P>

      <H2>Contact Us</H2>
      <P>
        If you have any questions about this Policy or our privacy practices, or if you would like to exercise your
        privacy rights, please contact us at:{' '}
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
