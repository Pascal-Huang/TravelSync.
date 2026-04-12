'use client'

import { useState, useEffect } from 'react'
import { PlanDetails } from '../../types' // Make sure this path is still correct!
import TopBar from '../TopBar'

interface Props {
  planDetails:  PlanDetails
  onApprove:    () => void
  onRegenerate: () => void
  showToast:    (msg: string) => void
}

const PHRASES = [
  "AI is synthesizing everyone's ideas…",
  'Weighing group preferences…',
  'Checking dealbreakers & dietary needs…',
  'Balancing budgets across the group…',
  'Finalising the perfect itinerary…',
]

interface Stop {
  when:    string
  time:    string
  dotCls:  string
  hasLine: boolean
  name:    string
  desc:    string
  tags:    { label: string; cls: string }[]
}

export default function AIDraft({ planDetails, onApprove, onRegenerate, showToast }: Props) {
  const [isLoading, setIsLoading] = useState(true)
  const [loadLabel, setLoadLabel] = useState(PHRASES[0])
  
  // 1. New Memory Boxes for our real AI data!
  const [tripTitle, setTripTitle] = useState("Proposed Itinerary ✦");
  const [itineraryStops, setItineraryStops] = useState<Stop[]>([])

  // 2. The function that talks to your backend
  const generateRealTrip = async () => {
    setIsLoading(true);
    setItineraryStops([]); // Clear old trip if regenerating
    
    try {
      // (Later, you will swap these hardcoded values with planDetails.location, etc.)
      const orderData = {
        location: "Tokyo, Japan",
        days: 2,
        ideas: "I want to eat sushi, visit a neon arcade, and I have a $500 budget."
      };

      const response = await fetch('/api/generate-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const aiData = await response.json();
      
      // Save the AI's creative title
      setTripTitle(aiData.tripName);

      // 3. Translate the AI JSON into your beautiful UI format!
      const formattedStops: Stop[] = [];
      const colors = ['bg-sage', 'bg-sand', 'bg-terra'];

      aiData.itinerary.forEach((day: any) => {
        day.activities.forEach((activity: any, index: number) => {
          // Grab a rotating color for the timeline dot
          const randomColor = colors[(day.day + index) % colors.length];

          formattedStops.push({
            when: `Day ${day.day}`,
            time: activity.time,
            dotCls: randomColor, 
            hasLine: true, // We will fix the very last one below
            name: activity.description.split('.')[0] || "Activity", // Uses first sentence as title
            desc: activity.description,
            tags: [
              { label: day.theme, cls: 'bg-sage-dim text-sage' }
            ]
          });
        });
      });

      // Remove the line from the very last stop so the UI looks clean
      if (formattedStops.length > 0) {
        formattedStops[formattedStops.length - 1].hasLine = false;
      }

      setItineraryStops(formattedStops);

    } catch (error) {
      console.error("Failed to fetch AI data:", error);
      showToast("Failed to generate trip. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Run the phrase rotator AND the real AI fetch when the page loads
  useEffect(() => {
    // Start phrase rotator
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % PHRASES.length;
      setLoadLabel(PHRASES[idx]);
    }, 1500); // Slowed down slightly so users can read them!

    // Start the real AI generation!
    generateRealTrip();

    return () => clearInterval(interval);
  }, []);

  // 5. Update the "Regenerate" button to actually fetch a new trip
  const handleRegenerate = () => {
    generateRealTrip();
    onRegenerate(); // Still call your original prop if needed
  };

  return (
    <section className="flex flex-col w-full max-w-[480px] min-h-[100dvh] px-5 pb-[52px] relative z-[1] animate-fade-up">
      <TopBar step="Step 2 / 3" />

      <div className="flex-1 flex flex-col">

        {/* ── Loading pane ────────────────────────────────────── */}
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 py-10 text-center">
            <div className="pulse-ring w-[66px] h-[66px] rounded-full bg-sage-dim flex items-center justify-center">
              <span className="text-[1.65rem]">✦</span>
            </div>
            <div>
              <p className="text-[0.9rem] text-ink-mid font-medium animate-load-pulse">
                {loadLabel}
              </p>
              <div className="flex gap-1.5 justify-center mt-2">
                <span className="w-1.5 h-1.5 bg-sage-light rounded-full animate-bounce-dot" />
                <span className="w-1.5 h-1.5 bg-sage-light rounded-full animate-bounce-dot [animation-delay:.2s]" />
                <span className="w-1.5 h-1.5 bg-sage-light rounded-full animate-bounce-dot [animation-delay:.4s]" />
              </div>
            </div>
          </div>
        )}

        {/* ── Draft result ─────────────────────────────────────── */}
        {!isLoading && (
          <div className="flex flex-col gap-4 animate-fade-up">
            <div>
              <h2 className="font-display text-[clamp(1.9rem,7.5vw,2.6rem)] leading-[1.13] tracking-[-0.02em] text-ink mb-2">
                {tripTitle}
              </h2>
            </div>

            <div className="bg-white border-[1.5px] border-cream-deep rounded-panel overflow-hidden shadow-float">
              <div className="bg-ink text-white px-[18px] py-[13px] flex items-center gap-2.5">
                <span className="text-[0.95rem]" aria-hidden="true">🗓️</span>
                <span className="text-[0.82rem] font-semibold tracking-[0.05em] uppercase">
                  Proposed Itinerary
                </span>
              </div>

              {/* Loop over our REAL AI stops instead of the hardcoded STOPS */}
              {itineraryStops.map((stop, i) => (
                <div key={i} className="px-[18px] py-[14px] flex items-start gap-3.5 border-b border-cream-deep last:border-b-0">
                  <div className="flex-shrink-0 min-w-[52px]">
                    <div className="text-[0.79rem] font-semibold text-sage">{stop.when}</div>
                    <div className="text-[0.65rem] font-semibold uppercase tracking-[0.07em] text-ink-faint mt-0.5">
                      {stop.time}
                    </div>
                  </div>

                  <div className="flex flex-col items-center pt-1 flex-shrink-0">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${stop.dotCls}`} />
                    {stop.hasLine && <div className="flex-1 w-px bg-cream-deep min-h-[22px] mt-1" />}
                  </div>

                  <div className="flex-1 pb-1">
                    <div className="text-[0.96rem] font-semibold text-ink leading-[1.3]">
                      {stop.name}
                    </div>
                    <div className="text-[0.8rem] text-ink-mid mt-0.5 leading-relaxed">
                      {stop.desc}
                    </div>
                    <div className="flex gap-[5px] flex-wrap mt-[7px]">
                      {stop.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className={`text-[0.66rem] font-semibold tracking-[0.04em] uppercase px-2 py-[2px] rounded-full ${tag.cls}`}>
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="grid grid-cols-2 gap-2.5">
                <button onClick={onApprove} className="flex flex-col items-center gap-[5px] py-4 px-2.5 border-[1.5px] border-cream-deep rounded-panel bg-white font-semibold text-[0.84rem] text-ink-mid shadow-soft transition-all active:scale-[0.95] hover:border-sage hover:bg-sage-dim hover:text-sage">
                  <span className="text-[1.6rem] leading-none">👍</span>
                  Looks Good
                </button>
                {/* Updated this to call our new handleRegenerate function! */}
                <button onClick={handleRegenerate} className="flex flex-col items-center gap-[5px] py-4 px-2.5 border-[1.5px] border-cream-deep rounded-panel bg-white font-semibold text-[0.84rem] text-ink-mid shadow-soft transition-all active:scale-[0.95] hover:border-sand hover:bg-sand-light hover:text-sand">
                  <span className="text-[1.6rem] leading-none">🔄</span>
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}