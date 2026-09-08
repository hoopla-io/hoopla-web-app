import { useTranslation } from "react-i18next";

import { Page } from "@/components/Page";

// NOTE: the ru/uz translations of this legal text are AI-generated and have NOT had a native-speaker or legal review. Do not treat them as a binding version until reviewed.
export const PrivacyPolicyPage = () => {
  const { t } = useTranslation();

  const content = `
            <div class="space-y-2 mb-8">
                <h2 class="font-bold text-xl">${t("privacy.docTitle")}</h2>
                <p>${t("privacy.docSubtitle")}</p>
            </div>
            <div class="space-y-2 mb-8">
                <h2 class="font-bold text-xl">${t("privacy.section1Title")}</h2>
                <p><strong>1.1.</strong> ${t("privacy.section1Para1")}</p>
                <p><strong>1.2.</strong> ${t("privacy.section1Para2")}</p>
                <p><strong>1.3.</strong> ${t("privacy.section1Para3")}</p>
            </div>
            <div class="space-y-2 mb-8">
                <h2 class="font-bold text-xl">${t("privacy.section2Title")}</h2>
                <p><strong>2.1.</strong> ${t("privacy.section2Para1")}</p>
                <p><strong>2.2.</strong> ${t("privacy.section2Para2")}</p>
                <p><strong>2.3.</strong> ${t("privacy.section2Para3")}</p>
                <p><strong>2.4.</strong> ${t("privacy.section2Para4")}</p>
            </div>
            <div class="space-y-2 mb-8">
                <h2 class="font-bold text-xl">${t("privacy.section3Title")}</h2>
                <p><strong>3.1.</strong> ${t("privacy.section3Para1")}</p>
                <div>
                    <p><strong>3.2.</strong> ${t("privacy.section3Para2Intro")}</p>
                    <ul>
                        <li>${t("privacy.section3Para2Item1")}</li>
                        <li>${t("privacy.section3Para2Item2")}</li>
                        <li>${t("privacy.section3Para2Item3")}</li>
                        <li>${t("privacy.section3Para2Item4")}</li>
                    </ul>
                </div>
                <div>
                    <p><strong>3.3.</strong> ${t("privacy.section3Para3Intro")}</p>
                    <ul>
                        <li>${t("privacy.section3Para3Item1")}</li>
                        <li>${t("privacy.section3Para3Item2")}</li>
                        <li>${t("privacy.section3Para3Item3")}</li>
                    </ul>
                </div>
                <h2 class="font-bold text-xl">${t("privacy.section4Title")}</h2>
                <p><strong>4.1.</strong> ${t("privacy.section4Para1")}</p>
                <p><strong>4.2.</strong> ${t("privacy.section4Para2")}</p>
            </div>
            <div class="space-y-2 mb-8">
                <h2 class="font-bold text-xl">${t("privacy.section5Title")}</h2>
                <p><strong>5.1.</strong> ${t("privacy.section5Para1")}</p>
                <p><strong>5.2.</strong> ${t("privacy.section5Para2")}</p>
                <p><strong>5.3.</strong> ${t("privacy.section5Para3")}</p>
            </div>
        `;

  return (
    <Page>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-coffee-brown">
            {t("privacy.pageTitle")}
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
};
