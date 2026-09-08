import { useTranslation } from "react-i18next";

import { Page } from "@/components/Page";

// NOTE: the ru/uz translations of this legal text are AI-generated and have NOT had a native-speaker or legal review. Do not treat them as a binding version until reviewed.
export default function TermsOfUse() {
  const { t } = useTranslation();

  const content = `
        <p>${t("terms.intro1")}</p>
        <p>${t("terms.intro2")}</p>
        <br />
        <div class="space-y-2 mb-8">
          <h2 class="font-bold text-xl">${t("terms.definitionsTitle")}</h2>
          <p><strong>“${t("terms.termSubscription")}”</strong> – ${t("terms.definitionSubscription")}</p>
          <p><strong>“${t("terms.termSubscriptionActivation")}”</strong> – ${t("terms.definitionSubscriptionActivation")}</p>
          <p><strong>“${t("terms.termSubscriptionCancellation")}”</strong> – ${t("terms.definitionSubscriptionCancellation")}</p>
          <p><strong>“${t("terms.termPartner")}”</strong> – ${t("terms.definitionPartner")}</p>
          <p><strong>“${t("terms.termUser")}”</strong> – ${t("terms.definitionUser")}</p>
          <p><strong>“${t("terms.termMobileApp")}”</strong> – ${t("terms.definitionMobileApp")}</p>
        </div>
        <div class="space-y-2 mb-8">
          <h2 class="font-bold text-xl">${t("terms.section1Title")}</h2>
          <p><strong>1.1.</strong> ${t("terms.section1Para1")}</p>
          <p><strong>1.2.</strong> ${t("terms.section1Para2")}</p>
          <p><strong>1.3.</strong> ${t("terms.section1Para3")}</p>
        </div>
        <div class="space-y-2 mb-8">
          <h2 class="font-bold text-xl">${t("terms.section2Title")}</h2>
          <div>
            <p><strong>2.1.</strong> ${t("terms.section2CompanyIntro")}</p>
            <ul>
              <li>${t("terms.section2CompanyItem1")}</li>
              <li>${t("terms.section2CompanyItem2")}</li>
              <li>${t("terms.section2CompanyItem3")}</li>
            </ul>
          </div>
          <div>
            <p><strong>2.2.</strong> ${t("terms.section2UserIntro")}</p>
            <ul>
              <li>${t("terms.section2UserItem1")}</li>
              <li>${t("terms.section2UserItem2")}</li>
              <li>${t("terms.section2UserItem3")}</li>
            </ul>
          </div>
        </div>
        <div class="space-y-2 mb-8">
          <h2 class="font-bold text-xl">${t("terms.section3Title")}</h2>
          <p><strong>3.1.</strong> ${t("terms.section3Para1")}</p>
          <p><strong>3.2.</strong> ${t("terms.section3Para2")}</p>
          <p><strong>3.3.</strong> ${t("terms.section3Para3")}</p>
          <p><strong>3.4.</strong> ${t("terms.section3Para4")}</p>
        </div>
        <div class="space-y-2 mb-8">
          <h2 class="font-bold text-xl">${t("terms.section4Title")}</h2>
          <p><strong>4.1.</strong> ${t("terms.section4Para1")}</p>
          <p><strong>4.2.</strong> ${t("terms.section4Para2")}</p>
        </div>
        <div class="space-y-2 mb-8">
          <h2 class="font-bold text-xl">${t("terms.section5Title")}</h2>
          <p><strong>5.1.</strong> ${t("terms.section5Para1")}</p>
        </div>
        <div class="space-y-2 mb-8">
          <h2 class="font-bold text-xl">${t("terms.section6Title")}</h2>
          <p><strong>6.1.</strong> ${t("terms.section6Para1")}</p>
        </div>
        <div class="space-y-2 mb-8">
          <h2 class="font-bold text-xl">${t("terms.section7Title")}</h2>
          <p><strong>7.1.</strong> ${t("terms.section7Para1")}</p>
          <p><strong>7.2.</strong> ${t("terms.section7Para2")}</p>
        </div>
      `;

  return (
    <Page>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-coffee-brown">
            {t("terms.pageTitle")}
          </h1>
        </div>
        <div className="max-w-none">
          <div
            dangerouslySetInnerHTML={{
              __html: content,
            }}
          />
        </div>
      </div>
    </Page>
  );
}
