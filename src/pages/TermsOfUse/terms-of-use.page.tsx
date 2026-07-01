import { Page } from "@/components/Page";

const terms = {
  title: "PUBLIC OFFER",
  lastUpdated: "Last updated:",
  content: `
        <p>On providing access to the subscription</p>
        <p>Limited Liability Company <span class="font-bold">"HOOPLA BRIDGE"</span>, hereinafter referred to as the "Company," represented by the Director acting under the Charter, offers to enter into this Public Offer for the provision of access to the subscription (hereinafter referred to as the Offer, Agreement, or Contract) under the terms set forth below:</p>
        <br />
        <div class="space-y-2 mb-8">
          <h2 class="font-bold text-xl">TERMS AND DEFINITIONS</h2>
          <p><strong>“Subscription”</strong> – the User's right to receive a specified number of cups of coffee at the Company’s partner establishments during the billing period, obtained through the mobile application <span class="font-bold">"HOOPLA"</span>.</p>
          <p><strong>“Subscription Activation”</strong> – the action taken by the User to gain actual access to the subscription after purchasing it.</p>
          <p><strong>“Subscription Cancellation”</strong> – the termination of the subscription due to the User’s violation of the terms of the Offer.</p>
          <p><strong>“Partner”</strong> – an individual entrepreneur or legal entity registered in the Republic of Uzbekistan, providing coffee services at partner coffee shops participating in the <span class="font-bold">"HOOPLA"</span> program.</p>
          <p><strong>“User”</strong> – an individual of legal age who has subscribed through the <span class="font-bold">"HOOPLA"</span> application to receive coffee at Partner establishments.</p>
          <p><strong>“Mobile Application”</strong> – the digital platform <span class="font-bold">"HOOPLA"</span>, available on iOS and Android, which allows users to purchase and manage subscriptions.</p>
        </div>
        <div class="space-y-2 mb-8">
          <h2 class="font-bold text-xl">GENERAL PROVISIONS</h2>
          <p><strong>1.1.</strong> This document constitutes a public offer. In accordance with Article 367 of the Civil Code of the Republic of Uzbekistan, a public offer is an invitation to enter into a contract under the stated terms with any person who expresses consent.</p>
          <p><strong>1.2.</strong> Actions indicating acceptance of the Offer (subscribing, using the <span class="font-bold">"HOOPLA"</span> application) constitute acceptance of the Offer.</p>
          <p><strong>1.3.</strong> The Company reserves the right to amend this Offer without prior notice to Users. The updated version takes effect from the moment it is published in the <span class="font-bold">"HOOPLA"</span> mobile application.</p>
        </div>
        <div class="space-y-2 mb-8">
          <h2 class="font-bold text-xl">RIGHTS AND OBLIGATIONS OF THE PARTIES</h2>
          <div>
            <p><strong>2.1.</strong> The Company undertakes to:</p>
            <ul>
              <li>Provide Users with access to the subscription through the <span class="font-bold">"HOOPLA"</span> application;</li>
              <li>Publish up-to-date information about Partners, their service conditions, and working hours;</li>
              <li>Ensure technical support for the application.</li>
            </ul>
          </div>
          <div>
            <p><strong>2.2.</strong> The User undertakes to:</p>
            <ul>
              <li>Use the subscription within the provided limit (1 cup of coffee per day);</li>
              <li>Not transfer the subscription to third parties;</li>
              <li>Follow the service rules of Partner coffee shops.</li>
            </ul>
          </div>
        </div>
        <div class="space-y-2 mb-8">
          <h2 class="font-bold text-xl">SUBSCRIPTION REGISTRATION AND USAGE TERMS</h2>
          <p><strong>3.1.</strong> The subscription is issued through the <span class="font-bold">"HOOPLA"</span> application and is personal.</p>
          <p><strong>3.2.</strong> The subscription price is determined by the Company and displayed in the application.</p>
          <p><strong>3.3.</strong> The subscription is valid for 30 calendar days from the date of activation.</p>
          <p><strong>3.4.</strong> In case of violation of usage rules by the User, the Company has the right to cancel the subscription without a refund.</p>
        </div>
        <div class="space-y-2 mb-8">
          <h2 class="font-bold text-xl">LIABILITY OF THE PARTIES</h2>
          <p><strong>4.1.</strong> The Company is not responsible for the quality of services provided by Partners.</p>
          <p><strong>4.2.</strong> In case of technical failures or temporary unavailability of the service, the Company undertakes to resolve the issue within a reasonable time.</p>
        </div>
        <div class="space-y-2 mb-8">
          <h2 class="font-bold text-xl">DISPUTE RESOLUTION</h2>
          <p><strong>5.1.</strong> Disputes arising from this Offer shall be resolved through negotiations. If the dispute cannot be resolved in this manner, the parties have the right to refer the matter to the court at the location of the Company.</p>
        </div>
        <div class="space-y-2 mb-8">
          <h2 class="font-bold text-xl">CONFIDENTIALITY</h2>
          <p><strong>6.1.</strong> The Company undertakes not to disclose Users’ personal data to third parties without their consent, except in cases provided for by the legislation of the Republic of Uzbekistan.</p>
        </div>
        <div class="space-y-2 mb-8">
          <h2 class="font-bold text-xl">FINAL PROVISIONS</h2>
          <p><strong>7.1.</strong> This Offer is valid indefinitely.</p>
          <p><strong>7.2.</strong> The full text of the Offer is available in the <span class="font-bold">"HOOPLA"</span> application and on the official website of the Company.</p>
        </div>
      `,
};

export default function TermsOfUse() {
  return (
    <Page>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-coffee-brown">
            {terms.title}
          </h1>
        </div>
        <div className="max-w-none">
          <div
            dangerouslySetInnerHTML={{
              __html: terms.content,
            }}
          />
        </div>
      </div>
    </Page>
  );
}
