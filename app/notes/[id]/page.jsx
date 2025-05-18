import { createClient } from "../../../supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import NoteCard from "../../components/notes/NoteCard";

/**
 * Individual Note Page
 * Displays a single note with all its details
 */
export default async function NotePage({ params }) {
  // Get the note ID from the URL params
  const { id } = params;
  
  // Server-side authentication check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // In a real implementation, we would fetch the specific note from the GCP backend
  // For now, we'll use placeholder data based on the ID
  
  // Dummy notes data (same as in the main notes page)
  const dummyNotes = [
    {
      id: "1",
      title: "Patient: John Doe - Initial Consultation",
      date: "2025-05-15T10:30:00Z",
      patient: "John Doe",
      type: "SOAP Note",
      tags: ["Hypertension", "Diabetes"],
      snippet: "Patient presents with complaints of persistent headaches and fatigue for the past two weeks. Reports increased stress at work.",
      content: {
        subjective: "Patient is a 45-year-old male presenting with complaints of persistent headaches and fatigue for the past two weeks. Reports increased stress at work and difficulty sleeping. Headaches are described as throbbing, primarily in the frontal region, and typically worse in the afternoon. Patient has been taking over-the-counter ibuprofen with minimal relief.",
        objective: "Vital Signs:\n- BP: 142/88 mmHg\n- HR: 78 bpm\n- RR: 16/min\n- Temp: 98.6°F\n- SpO2: 98%\n\nPhysical Examination:\n- General: Alert and oriented, appears tired\n- HEENT: Normocephalic, atraumatic, no sinus tenderness\n- CV: Regular rate and rhythm, no murmurs\n- Resp: Clear to auscultation bilaterally\n- Neuro: CN II-XII intact, no focal deficits",
        assessment: "1. Tension headaches, likely related to stress and possible hypertension\n2. Fatigue, possibly related to poor sleep quality\n3. Elevated blood pressure, consistent with hypertension",
        plan: "1. Start lisinopril 10mg daily for hypertension\n2. Recommend stress management techniques and sleep hygiene practices\n3. Advise to limit caffeine intake, especially in the afternoon\n4. Follow-up in 2 weeks to reassess blood pressure and headache symptoms\n5. Complete blood count and basic metabolic panel ordered"
      }
    },
    {
      id: "2",
      title: "Patient: Jane Smith - Follow-up Visit",
      date: "2025-05-14T14:15:00Z",
      patient: "Jane Smith",
      type: "Progress Note",
      tags: ["Asthma", "Allergies"],
      snippet: "Patient returns for follow-up of asthma management. Reports improved symptoms with current medication regimen.",
      content: "Patient returns for follow-up of asthma management. Reports improved symptoms with current medication regimen. No recent exacerbations or ER visits. Using rescue inhaler approximately once per week, typically after exercise.\n\nVital signs stable. Lung exam reveals good air entry bilaterally with no wheezing.\n\nAssessment: Well-controlled asthma\n\nPlan:\n1. Continue current medications\n2. Refill albuterol inhaler\n3. Encouraged continued exercise with appropriate pre-treatment\n4. Return in 6 months for routine follow-up"
    },
    {
      id: "3",
      title: "Patient: Robert Johnson - New Patient Visit",
      date: "2025-05-12T09:00:00Z",
      patient: "Robert Johnson",
      type: "SOAP Note",
      tags: ["Back Pain", "Physical Therapy"],
      snippet: "New patient intake for chronic lower back pain. Patient reports pain began approximately 3 months ago after lifting heavy furniture.",
      content: {
        subjective: "New patient intake for chronic lower back pain. Patient reports pain began approximately 3 months ago after lifting heavy furniture. Describes pain as dull and aching, occasionally sharp with certain movements. Pain is located in the lumbar region with occasional radiation to the right buttock. Rates pain as 4-7/10, worse with prolonged sitting and bending. Has tried over-the-counter NSAIDs with moderate relief.",
        objective: "Vital Signs:\n- BP: 124/76 mmHg\n- HR: 72 bpm\n- RR: 14/min\n- Temp: 98.4°F\n\nPhysical Examination:\n- MSK: Decreased range of motion in lumbar spine, especially with flexion. Tenderness to palpation over right paraspinal muscles. Negative straight leg raise bilaterally. Normal strength in lower extremities.\n- Neuro: DTRs 2+ and symmetric. No sensory deficits.",
        assessment: "1. Chronic mechanical low back pain, likely muscular in origin\n2. No evidence of radiculopathy or neurological compromise",
        plan: "1. Prescribed cyclobenzaprine 5mg at bedtime for muscle spasm\n2. Referred to physical therapy for core strengthening and proper body mechanics\n3. Advised continued use of NSAIDs as needed\n4. Discussed importance of proper lifting techniques\n5. Return in 4 weeks to assess progress"
      }
    },
    {
      id: "4",
      title: "Patient: Sarah Williams - Annual Physical",
      date: "2025-05-10T11:00:00Z",
      patient: "Sarah Williams",
      type: "Preventive Care",
      tags: ["Annual Exam", "Preventive"],
      snippet: "Patient presents for annual physical examination. No significant health concerns reported.",
      content: "Patient presents for annual physical examination. No significant health concerns reported. Maintains active lifestyle with regular exercise 3-4 times per week. Non-smoker, occasional alcohol use (1-2 drinks per week).\n\nVital signs within normal limits. Physical exam unremarkable.\n\nAssessment: Healthy adult female\n\nPlan:\n1. Routine labs ordered including CBC, CMP, lipid panel\n2. Mammogram scheduled\n3. Flu vaccine administered\n4. Return in one year for next annual exam"
    }
  ];
  
  // Find the note with the matching ID
  const note = dummyNotes.find(note => note.id === id);
  
  // If no note is found, we could handle this with a "not found" UI
  // For now, we'll just use a simple message
  if (!note) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Link href="/notes" className="flex items-center text-royal hover:underline mb-6">
          <ArrowLeft size={18} className="mr-2" />
          Back to Notes
        </Link>
        
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Note Not Found</h1>
          <p className="text-gray-500 mb-6">The note you're looking for doesn't exist or has been deleted.</p>
          <Link 
            href="/notes" 
            className="inline-block px-4 py-2 bg-royal text-white rounded-md hover:bg-royal-700 transition-colors"
          >
            View All Notes
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Back Link */}
      <Link href="/notes" className="flex items-center text-royal hover:underline mb-6">
        <ArrowLeft size={18} className="mr-2" />
        Back to Notes
      </Link>
      
      {/* Note Card */}
      <NoteCard note={note} />
    </div>
  );
}
