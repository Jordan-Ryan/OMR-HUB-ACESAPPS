import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions - OMR Hub',
  description: 'Terms and Conditions for OMR Hub app',
};

export default function TermsPage() {
  return (
    <div
      style={{
        padding: '24px 24px',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      <div className="card">
        <h1
          style={{
            fontSize: '34px',
            fontWeight: '700',
            lineHeight: '41px',
            letterSpacing: '0.37px',
            marginBottom: '8px',
            color: '#FFFFFF',
          }}
        >
          Terms & Conditions
        </h1>
        <p
          style={{
            fontSize: '15px',
            lineHeight: '20px',
            letterSpacing: '-0.24px',
            color: 'rgba(235, 235, 245, 0.6)',
            marginBottom: '16px',
          }}
        >
          Last updated: January 1, 2025
        </p>

        <div
          style={{
            fontSize: '17px',
            lineHeight: '22px',
            letterSpacing: '-0.41px',
            color: 'rgba(235, 235, 245, 0.6)',
          }}
        >
          <section style={{ marginBottom: '16px' }}>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: '700',
                lineHeight: '28px',
                letterSpacing: '0.35px',
                marginBottom: '12px',
                color: '#FFFFFF',
              }}
            >
              1. Acceptance of Terms
            </h2>
            <p style={{ marginBottom: '16px' }}>
              By accessing or using OMR Hub ("the Application"), you agree to be
              bound by these Terms and Conditions ("Terms"). If you disagree with
              any part of these terms, then you may not access the Application.
            </p>
            <p>
              We reserve the right to update, change, or replace any part of
              these Terms by posting updates and changes to our website. It is your
              responsibility to check our website periodically for changes. Your
              continued use of or access to the Application following the posting
              of any changes constitutes acceptance of those changes.
            </p>
          </section>

          <section style={{ marginBottom: '16px' }}>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: '700',
                lineHeight: '28px',
                letterSpacing: '0.35px',
                marginBottom: '12px',
                color: '#FFFFFF',
              }}
            >
              2. Use License
            </h2>
            <p style={{ marginBottom: '16px' }}>
              Permission is granted to temporarily download one copy of OMR Hub for
              personal, non-commercial transitory viewing only. This is the grant
              of a license, not a transfer of title, and under this license you
              may not:
            </p>
            <ul
              style={{
                paddingLeft: '24px',
                marginBottom: '16px',
                listStyle: 'disc',
              }}
            >
              <li style={{ marginBottom: '8px' }}>
                Modify or copy the materials
              </li>
              <li style={{ marginBottom: '8px' }}>
                Use the materials for any commercial purpose or for any public
                display
              </li>
              <li style={{ marginBottom: '8px' }}>
                Attempt to reverse engineer any software contained in the
                Application
              </li>
              <li style={{ marginBottom: '8px' }}>
                Remove any copyright or other proprietary notations from the
                materials
              </li>
              <li style={{ marginBottom: '8px' }}>
                Transfer the materials to another person or "mirror" the materials
                on any other server
              </li>
            </ul>
            <p>
              This license shall automatically terminate if you violate any of
              these restrictions and may be terminated by us at any time.
            </p>
          </section>

          <section style={{ marginBottom: '16px' }}>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: '700',
                lineHeight: '28px',
                letterSpacing: '0.35px',
                marginBottom: '12px',
                color: '#FFFFFF',
              }}
            >
              3. User Accounts
            </h2>
            <p style={{ marginBottom: '16px' }}>
              When you create an account with us, you must provide information that
              is accurate, complete, and current at all times. You are responsible
              for safeguarding the password and for all activities that occur under
              your account.
            </p>
            <p>
              You agree not to disclose your password to any third party and to
              take sole responsibility for any activities or actions under your
              account, whether or not you have authorized such activities or
              actions.
            </p>
          </section>

          <section style={{ marginBottom: '16px' }}>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: '700',
                lineHeight: '28px',
                letterSpacing: '0.35px',
                marginBottom: '12px',
                color: '#FFFFFF',
              }}
            >
              4. User Content
            </h2>
            <p style={{ marginBottom: '16px' }}>
              Our Application allows you to post, link, store, share, and otherwise
              make available certain information, text, graphics, or other
              material ("User Content"). You are responsible for the User Content
              that you post on or through the Application.
            </p>
            <p style={{ marginBottom: '16px' }}>
              You retain ownership of your User Content. By posting User Content on
              or through the Application, you grant us a worldwide, non-exclusive,
              royalty-free license to use, reproduce, modify, and distribute your
              User Content solely for the purpose of operating and providing the
              Application.
            </p>
            <p>
              You agree not to post User Content that: (i) is illegal, harmful,
              threatening, abusive, or discriminatory; (ii) infringes any
              intellectual property rights; (iii) contains viruses or other
              harmful code; or (iv) violates any applicable laws or regulations.
            </p>
          </section>

          <section style={{ marginBottom: '16px' }}>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: '700',
                lineHeight: '28px',
                letterSpacing: '0.35px',
                marginBottom: '12px',
                color: '#FFFFFF',
              }}
            >
              5. Intellectual Property
            </h2>
            <p style={{ marginBottom: '16px' }}>
              The Application and its original content, features, and functionality
              are and will remain the exclusive property of OMR Hub and its
              licensors. The Application is protected by copyright, trademark, and
              other laws. Our trademarks and trade dress may not be used in
              connection with any product or service without our prior written
              consent.
            </p>
            <p>
              All other trademarks, service marks, graphics, and logos used in
              connection with the Application are the property of their respective
              owners.
            </p>
          </section>

          <section style={{ marginBottom: '16px' }}>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: '700',
                lineHeight: '28px',
                letterSpacing: '0.35px',
                marginBottom: '12px',
                color: '#FFFFFF',
              }}
            >
              6. Prohibited Uses
            </h2>
            <p style={{ marginBottom: '16px' }}>
              You may not use the Application:
            </p>
            <ul
              style={{
                paddingLeft: '24px',
                marginBottom: '16px',
                listStyle: 'disc',
              }}
            >
              <li style={{ marginBottom: '8px' }}>
                In any way that violates any applicable law or regulation
              </li>
              <li style={{ marginBottom: '8px' }}>
                To transmit, or procure the sending of, any advertising or
                promotional material without our prior written consent
              </li>
              <li style={{ marginBottom: '8px' }}>
                To impersonate or attempt to impersonate the company, a company
                employee, another user, or any other person or entity
              </li>
              <li style={{ marginBottom: '8px' }}>
                In any way that infringes upon the rights of others
              </li>
              <li style={{ marginBottom: '8px' }}>
                To engage in any other conduct that restricts or inhibits anyone's
                use or enjoyment of the Application
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: '16px' }}>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: '700',
                lineHeight: '28px',
                letterSpacing: '0.35px',
                marginBottom: '12px',
                color: '#FFFFFF',
              }}
            >
              7. Limitation of Liability
            </h2>
            <p style={{ marginBottom: '16px' }}>
              In no event shall OMR Hub, nor its directors, employees, partners,
              agents, suppliers, or affiliates, be liable for any indirect,
              incidental, special, consequential, or punitive damages, including
              without limitation, loss of profits, data, use, goodwill, or other
              intangible losses, resulting from your use of the Application.
            </p>
            <p>
              Our total liability to you for all claims arising out of or relating
              to the use of or inability to use the Application shall not exceed
              the amount you paid us to use the Application, or if you have not
              paid anything, then one hundred dollars ($100).
            </p>
          </section>

          <section style={{ marginBottom: '16px' }}>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: '700',
                lineHeight: '28px',
                letterSpacing: '0.35px',
                marginBottom: '12px',
                color: '#FFFFFF',
              }}
            >
              8. Disclaimer
            </h2>
            <p style={{ marginBottom: '16px' }}>
              The information on the Application is provided on an "as is" basis.
              To the fullest extent permitted by law, OMR Hub excludes all
              representations, warranties, conditions, and terms relating to the
              Application and the use of the Application.
            </p>
            <p>
              OMR Hub does not warrant that the Application will be available at
              all times or that the information on the Application is complete,
              reliable, or error-free.
            </p>
          </section>

          <section style={{ marginBottom: '16px' }}>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: '700',
                lineHeight: '28px',
                letterSpacing: '0.35px',
                marginBottom: '12px',
                color: '#FFFFFF',
              }}
            >
              9. Indemnification
            </h2>
            <p>
              You agree to defend, indemnify, and hold harmless OMR Hub and its
              licensee and licensors, and their employees, contractors, agents,
              officers and directors, from and against any and all claims, damages,
              obligations, losses, liabilities, costs or debt, and expenses
              (including but not limited to solicitors' fees), resulting from or
              arising out of (a) your use and access of the Application, (b) your
              violation of any term of these Terms, or (c) your violation of any
              third party right, including without limitation any copyright,
              property, or privacy right.
            </p>
          </section>

          <section style={{ marginBottom: '16px' }}>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: '700',
                lineHeight: '28px',
                letterSpacing: '0.35px',
                marginBottom: '12px',
                color: '#FFFFFF',
              }}
            >
              10. Termination
            </h2>
            <p style={{ marginBottom: '16px' }}>
              We may terminate or suspend your account and bar access to the
              Application immediately, without prior notice or liability, under our
              sole discretion, for any reason whatsoever and without limitation,
              including but not limited to a breach of the Terms.
            </p>
            <p>
              If you wish to terminate your account, you may simply discontinue
              using the Application or delete your account through the Application
              settings.
            </p>
          </section>

          <section style={{ marginBottom: '16px' }}>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: '700',
                lineHeight: '28px',
                letterSpacing: '0.35px',
                marginBottom: '12px',
                color: '#FFFFFF',
              }}
            >
              11. Governing Law
            </h2>
            <p>
              These Terms shall be interpreted and governed by the laws of the
              jurisdiction in which OMR Hub operates, without regard to its
              conflict of law provisions. Our failure to enforce any right or
              provision of these Terms will not be considered a waiver of those
              rights.
            </p>
          </section>

          <section style={{ marginBottom: '16px' }}>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: '700',
                lineHeight: '28px',
                letterSpacing: '0.35px',
                marginBottom: '12px',
                color: '#FFFFFF',
              }}
            >
              12. Changes to Terms
            </h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace
              these Terms at any time. If a revision is material, we will provide
              at least 30 days notice prior to any new terms taking effect. What
              constitutes a material change will be determined at our sole
              discretion.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: '700',
                lineHeight: '28px',
                letterSpacing: '0.35px',
                marginBottom: '12px',
                color: '#FFFFFF',
              }}
            >
              13. Contact Information
            </h2>
            <p style={{ marginBottom: '16px' }}>
              If you have any questions about these Terms, please contact us:
            </p>
            <p style={{ marginBottom: '8px' }}>
              Email:{' '}
              <a
                href="mailto:OMRHub@acesapps.com"
                style={{ color: '#007AFF' }}
              >
                OMRHub@acesapps.com
              </a>
            </p>
            <p>
              Website:{' '}
              <a
                href="https://omrhub.acesapps.com"
                style={{ color: '#007AFF' }}
              >
                https://omrhub.acesapps.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
