import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <Button variant="outline" onClick={() => navigate('/')}>Back to Home</Button>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Privacy Policy for Peta-Progress</CardTitle>
            <CardDescription>Last Updated: 30th October 2025</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none text-foreground">
            <p>Petaera Technologies ("Peta-Progress," "we," "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share information. This policy applies to the Peta-Progress task management platform ("Service").</p>

            <h3>Our Role: Processor vs. Controller</h3>
            <p>This is important:</p>
            <ul>
              <li>The <strong>Customer</strong> (the Organization) that signs up for our Service is the <strong>Data Controller</strong>. They decide what data to collect from their Users and how it is used.</li>
              <li><strong>Peta-Progress</strong> is the <strong>Data Processor</strong>. We process data on behalf of the Customer, according to their instructions (as defined in our Terms of Service).</li>
            </ul>
            <p>This policy primarily describes how we process data on behalf of our Customers.</p>

            <h3>1. Information We Collect</h3>
            <p><strong>A. Information Provided by Customers and Users:</strong></p>
            <ul>
              <li><strong>Account Information:</strong> When an Organization signs up, we collect a contact name, email, and organization name.</li>
              <li><strong>User Profile Information:</strong> We collect information on behalf of the Customer for each User, including Full Name, Email, Role, Department, Working Hours, and Availability Status.</li>
              <li><strong>Customer Content:</strong> We collect and store the content Users generate, including Tasks (titles, descriptions) and Daily Logs (tasks completed, hours spent).</li>
            </ul>
            <p><strong>B. Information Collected Automatically:</strong></p>
            <ul>
              <li><strong>Usage Data:</strong> We automatically log user_sessions (login/logout times), last_seen status, and IP addresses.</li>
              <li><strong>Cookies:</strong> We use necessary cookies to maintain your session and ensure the security of your account.</li>
            </ul>

            <h3>2. How We Use Information</h3>
            <ul>
              <li><strong>Provide and maintain the Service:</strong> Authenticate users, display tasks, and log data.</li>
              <li><strong>Communicate with you:</strong> Send service announcements, security alerts, and support messages.</li>
              <li><strong>For Security:</strong> To monitor and prevent fraudulent activity and protect the integrity of the Service.</li>
              <li><strong>To Improve the Service:</strong> We may use aggregated and anonymized data to understand how our Service is used.</li>
            </ul>
            <p><strong>We do not sell your personal data.</strong></p>

            <h3>3. How We Share Information</h3>
            <ul>
              <li><strong>With Your Organization:</strong> All information you provide (profile) and generate (tasks, logs) is visible to the Admin(s) of your Organization and, depending on their settings, to other Users within your Organization.</li>
              <li><strong>With Third-Party Service Providers:</strong> We use trusted third parties to help us operate (e.g., cloud hosting, email delivery). These providers are Data Processors and are only permitted to use the information to provide services to us.</li>
              <li><strong>For Legal Reasons:</strong> We may disclose information if required by law or in response to a valid legal request (e.g., a subpoena).</li>
              <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that deal.</li>
            </ul>

            <h3>4. Data Security</h3>
            <p>We take security seriously. We use industry-standard technical and organizational measures to protect your data, including Row Level Security (RLS) to enforce data separation between organizations, encryption in transit (HTTPS), and secure authentication. However, no system is 100% secure, and we cannot guarantee the absolute security of your information.</p>

            <h3>5. Your Data Rights</h3>
            <p>Because the <strong>Customer (your Organization) is the Data Controller</strong>, all requests related to your personal data should be directed to your Organization's Admin.</p>
            <p>This includes requests to: Access, correct/update, or delete your personal information. Peta-Progress will work with our Customers to help them respond to these requests as required by law.</p>

            <h3>6. Data Retention</h3>
            <p>We retain your information for as long as your Organization's account is active or as needed to provide the Service. We may also retain information to comply with legal obligations or resolve disputes.</p>

            <h3>7. Children's Privacy</h3>
            <p>Our Service is not intended for or directed at individuals under the age of 16. We do not knowingly collect personal information from children.</p>

            <h3>8. Changes to this Policy</h3>
            <p>We may update this Privacy Policy. We will notify you of any material changes by email or through an in-app notification.</p>

            <h3>9. Contact Us</h3>
            <p>If you have questions about this Privacy Policy, please contact us at info@petaera.com. For questions about your specific data, please contact your Organization's administrator.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;


