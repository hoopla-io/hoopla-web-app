import { Page } from "@/components/Page";

const privacy = {
  title: "Privacy Policy",
  content: `
            <div class="space-y-2 mb-8">
                <h2 class="font-bold text-xl">PRIVACY POLICY</h2>
                <p>Policy on the collection and processing of personal data of LLC "ALPHAZET TECHNOLOGIES" HOOPLA</p>
            </div>
            <div class="space-y-2 mb-8">
                <h2 class="font-bold text-xl">General Provisions</h2>
                <p><strong>1.1.</strong> This policy on the collection and processing of personal data (hereinafter referred to as the Policy) is drawn up in accordance with the requirements of the Law of the Republic of Uzbekistan "On Personal Data" dated July 2, 2019 No. ZRU-547 and defines the procedure for collecting and processing personal data and measures to protect personal data.</p>
                <p><strong>1.2.</strong> This Policy applies to personal data that the Operator may obtain from Users through the Service, the "HOOPLA" Application, and the Landing Page, as well as during interactions with Users, including phone calls.</p>
                <p><strong>1.3.</strong> This Policy is a publicly available document and is subject to placement in the "HOOPLA" Application.</p>
            </div>
            <div class="space-y-2 mb-8">
                <h2 class="font-bold text-xl">Key Definitions</h2>
                <p><strong>2.1.</strong> Operator – LLC "ALPHAZET TECHNOLOGIES", which independently organizes and (or) carries out the collection and processing of personal data within the "HOOPLA" Application, as well as determines the purposes of personal data processing, the list of data to be collected and processed, and the operations performed.</p>
                <p><strong>2.2.</strong> User – an individual who has reached the age of majority and uses the "HOOPLA" Application to receive services provided by partner coffee shops.</p>
                <p><strong>2.3.</strong> Partner – a legal entity or an individual entrepreneur registered in accordance with the legislation of the Republic of Uzbekistan, providing services to Users as part of cooperation with "HOOPLA".</p>
                <p><strong>2.4.</strong> Personal data – information related to a specific User that allows their identification.</p>
            </div>
            <div class="space-y-2 mb-8">
                <h2 class="font-bold text-xl">Collection and Processing of Personal Data</h2>
                <p><strong>3.1.</strong> Personal data is collected when the User registers in the "HOOPLA" Application or subscribes to a membership plan.</p>
                <div>
                    <p><strong>3.2.</strong> The Operator has the right to process the following personal data:</p>
                    <ul>
                        <li>Last name, first name, middle name;</li>
                        <li>Phone number;</li>
                        <li>Email address;</li>
                        <li>Data on the use of the "HOOPLA" Application.</li>
                    </ul>
                </div>
                <div>
                    <p><strong>3.3.</strong> Personal data is collected and used for:</p>
                    <ul>
                        <li>Providing Users with services available in the "HOOPLA" Application;</li>
                        <li>Improving service quality and analyzing user experience;</li>
                        <li>Fulfilling contractual obligations to Partners.</li>
                    </ul>
                </div>
                <h2 class="font-bold text-xl">Protection of Personal Data</h2>
                <p><strong>4.1.</strong> The Operator takes all necessary measures to protect personal data from unauthorized access and leakage.</p>
                <p><strong>4.2.</strong> The transfer of personal data to third parties is possible only within the framework of the agreement between the User and the Operator or when there are legal grounds.</p>
            </div>
            <div class="space-y-2 mb-8">
                <h2 class="font-bold text-xl">Final Provisions</h2>
                <p><strong>5.1.</strong> The Operator reserves the right to amend this Policy in accordance with changes in legislation or the development of the "HOOPLA" service.</p>
                <p><strong>5.2.</strong> The new version of the Policy comes into force from the moment of its publication in the "HOOPLA" Application.</p>
                <p><strong>5.3.</strong> The User may send a request regarding their personal data to the Operator's email address.</p>
            </div>
        `,
};

export const PrivacyPolicyPage = () => {
  return (
    <Page>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-coffee-brown">
            {privacy.title}
          </h1>
        </div>
        <div className="max-w-none">
          <div
            dangerouslySetInnerHTML={{
              __html: privacy.content,
            }}
          />
        </div>
      </div>
    </Page>
  );
};
