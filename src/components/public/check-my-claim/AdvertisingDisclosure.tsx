'use client'

import { DocModalPage, NoWinNoFeeCard } from './_shared'

const STATE_DISCLOSURES: { state: string; text: string }[] = [
  { state: 'Alabama', text: 'UL makes no representation that the quality of the legal services to be performed by it is greater than the quality of the legal services by other lawyers.' },
  { state: 'Alaska', text: 'The Alaska Bar Association does not endorse or accredit certifying organizations.' },
  { state: 'Arizona', text: 'checkmyclaim.co is a website name and not a law firm. The law firms who advertise through this website do not operate as checkmyclaim.co' },
  { state: 'California', text: 'Please note that checkmyclaim.co is an attorney marketing network and is not affiliated with any government agency. checkmyclaim.co does not receive any funding from any government or not-for-profit foundation.' },
  { state: 'Colorado', text: 'checkmyclaim.co is a website name and not a law firm. The law firms who advertise through this website do not operate as checkmyclaim.co.' },
  { state: 'Florida', text: 'The hiring of an attorney is an important decision, and that decision should not be based solely on advertising material. Before you decide to hire counsel to represent you, make sure you ask us or any attorney to send you free written information about the attorney’s qualifications and experience.' },
  { state: 'Georgia', text: 'checkmyclaim.co is a website name and not a law firm. The law firms who advertise through this website do not operate as checkmyclaim.co.' },
  { state: 'Hawaii', text: 'The Supreme Court of Hawaii only grants certification to lawyers in good standing who have successfully completed a specialty program accredited by the American Bar Association.' },
  { state: 'Illinois', text: 'The Illinois Supreme Court does not recognize certifications of specialties in the practice of law. A certificate, award, or recognition is not required to practice law in Illinois.' },
  { state: 'Indiana', text: 'checkmyclaim.co is a website name and not a law firm. The law firms who advertise through this website do not operate as checkmyclaim.co.' },
  { state: 'Iowa', text: 'checkmyclaim.co is a website name and not a law firm. The law firms who advertise through this website do not operate as checkmyclaim.co. The Supreme Court of Iowa requires the following disclosure: The choice of a lawyer and the determination of the need for legal assistance are extremely important decisions and should not be based on advertisements or self-proclaimed expertise.' },
  { state: 'Kentucky', text: 'checkmyclaim.co is a website name and not a law firm. The law firms who advertise through this website do not operate as checkmyclaim.co.' },
  { state: 'Maine', text: 'checkmyclaim.co is a website name and not a law firm. The law firms who advertise through this website do not operate as checkmyclaim.co.' },
  { state: 'Massachusetts', text: 'The Commonwealth of Massachusetts does not certify lawyers in any particular field of law. If an attorney in Massachusetts indicates he/she is "certified" in a particular area of law, service, or field by a non-governmental body, the certifying organization is a private organization whose standards for certification are not regulated by the Commonwealth.' },
  { state: 'Mississippi', text: 'checkmyclaim.co is a website name and not a law firm. The law firms who advertise through this website do not operate as checkmyclaim.co. Background information on any Mississippi attorney is available free upon request to that attorney. Mississippi has no procedure for approving, certifying, or designating organizations and authorities.' },
  { state: 'Missouri', text: 'ADVERTISING MATERIAL: COMMERCIAL SOLICITATIONS ARE PERMITTED BY THE MISSOURI RULES OF PROFESSIONAL CONDUCT, BUT ARE NEITHER SUBMITTED NOR APPROVED BY THE MISSOURI BAR OR THE SUPREME COURT OF MISSOURI. Likewise, neither the Supreme Court nor the Missouri Bar reviews or approves certifying organizations or specialist designations in the field of law.' },
  { state: 'Nevada', text: 'checkmyclaim.co is a website name and not a law firm. Neither the State Bar of Nevada nor any agency of the State Bar has certified any lawyer identified in this advertisement as a specialist or expert, except as indicated. Anyone considering hiring an attorney should independently investigate the lawyer’s qualifications, credentials, and ability.' },
  { state: 'New Jersey', text: 'checkmyclaim.co is a website name and not a law firm. The Supreme Court of New Jersey recognizes certifications in some areas of legal practice; participation by any law firm listed here in those certifications is not represented or endorsed by checkmyclaim.co.' },
  { state: 'New Mexico', text: 'Any certification by an organization other than the New Mexico Board of Legal Specialization does not constitute recognition by the New Mexico Board of Legal Specialization unless the lawyer is also recognized by the board as a specialist in that particular area of law.' },
  { state: 'New York', text: 'checkmyclaim.co is a website name and not a law firm. The law firms who advertise through this website do not operate as checkmyclaim.co.' },
  { state: 'Rhode Island', text: 'The Rhode Island Supreme Court licenses all lawyers in the general practice of law. The Court does not license or certify any lawyer as an expert or specialist in any field of practice of law.' },
  { state: 'Tennessee', text: 'Tennessee recognizes Certifications of Specialization in the following areas of practice of law: Civil Trial, Criminal Trial, Business Bankruptcy, Consumer Bankruptcy, Creditor’s Rights, Medical Malpractice, Legal Malpractice, Accounting Malpractice, Elder Law, Estate Planning, and Family Law.' },
  { state: 'Texas', text: 'checkmyclaim.co is a website name and not a law firm. The law firms who advertise through this website do not operate as checkmyclaim.co. Lawyers named on this site are not certified by the Texas Board of Legal Specialization unless otherwise specifically indicated.' },
  { state: 'Washington', text: 'The Supreme Court of Washington does not recognize certification of specialties in the practice of law. Any such certificate, award, or recognition is not required to practice law in the State of Washington.' },
  { state: 'Wyoming', text: 'The State Bar of the State of Wyoming does not certify any lawyer as a specialist or expert. Any person considering a lawyer for representation should independently investigate the lawyer’s credentials, qualifications, and ability and should not rely on advertisements or self-proclaimed expertise.' },
]

export default function AdvertisingDisclosure() {
  return (
    <DocModalPage title="Advertising Disclosure">
      <p className="mb-6" style={{ color: '#595E64', lineHeight: 1.625 }}>
        checkmyclaim.co is a non-professional legal services agency that connects service providers with consumers to
        help them live better lives, and when you call our number, you may be directly connected with one of our
        partners or a third party to assist you. Independent providers of the services may charge fees and have their
        own terms of service. checkmyclaim.co is not responsible and does not guarantee any outcomes from these
        providers. Services may not be available in all states, so please call or check our website for details.
      </p>
      <p className="mb-8" style={{ color: '#595E64', lineHeight: 1.625 }}>
        This Agreement contains a binding arbitration agreement, which provides that you and we agree to resolve
        certain disputes through binding individual arbitration and give up any right to have those disputes decided
        by a judge or a jury. You have the right to opt out of our agreement to arbitrate. See the Legal Disputes
        section of this Agreement.
      </p>

      <h2 className="text-[1.5rem] font-bold mb-6" style={{ color: '#111E30' }}>
        State Specific Legal Advertising Disclosures
      </h2>

      <div className="flex flex-col gap-4 mb-8">
        {STATE_DISCLOSURES.map((s) => (
          <div
            key={s.state}
            style={{
              borderLeft: '4px solid #0285E9',
              background: '#f9fafb',
              borderRadius: '0 8px 8px 0',
              padding: 16,
            }}
          >
            <p className="text-[1.125rem] font-bold mb-2" style={{ color: '#111E30' }}>
              {s.state}
            </p>
            <p className="text-[14px]" style={{ color: '#595E64', lineHeight: 1.625 }}>
              {s.text}
            </p>
          </div>
        ))}
      </div>

      <NoWinNoFeeCard />
    </DocModalPage>
  )
}
