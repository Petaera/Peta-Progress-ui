import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Users, BarChart3, Clock } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Team Management",
      description: "Organize teams, departments, and track member availability in real-time",
    },
    {
      icon: CheckCircle2,
      title: "Task Tracking",
      description: "Create work allotments, assign tasks, and monitor completion status",
    },
    {
      icon: Clock,
      title: "Time Logging",
      description: "Submit daily logs with hours worked and progress notes",
    },
    {
      icon: BarChart3,
      title: "Progress Analytics",
      description: "Visualize team performance and project progress at a glance",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-subtle border-b">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary shadow-lg mb-4">
              <span className="text-4xl font-bold text-white">P</span>
            </div>
            <div className="text-sm uppercase tracking-widest text-primary font-semibold">PETA-PROGRESS</div>
            
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Track Progress,<br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Empower Teams
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              PETA-PROGRESS helps you organize teams and departments, assign and track tasks, log daily work, and visualize performance.
              Built-in real-time updates keep managers and teams aligned.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="text-lg px-8 shadow-lg"
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/dashboard?demo=1')}
                className="text-lg px-8"
              >
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need</h2>
          <p className="text-muted-foreground text-lg">
            Built for modern teams who value transparency and progress
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="shadow-soft hover:shadow-medium transition-shadow">
                <CardContent className="pt-6 space-y-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to transform your team?
            </h2>
            <p className="text-muted-foreground text-lg">
              Join teams who are already tracking progress more effectively
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="text-lg px-8 shadow-lg"
            >
              Start Free Today
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div className="text-center md:text-left">
              <div className="font-semibold text-foreground mb-2">PETA-PROGRESS</div>
              <p>Track teams, manage work, and make progress visible.</p>
              <div className="mt-3">
                <p>
                  <a
                    href="https://petaera.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-foreground underline-offset-2 hover:underline"
                  >
                    Petaera Technologies
                  </a>
                </p>
                <p>
                  <a href="mailto:info@petaera.com" className="underline hover:text-foreground">
                    info@petaera.com
                  </a>
                </p>
              </div>
            </div>
            <div className="text-center"></div>
            <div className="text-center md:text-right">
              <div className="font-semibold text-foreground mb-2">Legal</div>
              <p>
                <button type="button" className="underline hover:text-foreground" onClick={() => navigate('/privacy')}>
                  Privacy Policy
                </button>
              </p>
              <p>
                <button type="button" className="underline hover:text-foreground" onClick={() => navigate('/terms')}>
                  Terms of Service
                </button>
              </p>
            </div>
          </div>
          <div className="text-center text-xs text-muted-foreground mt-6">© 2025 PETAERA TECHNOLOGIES. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
