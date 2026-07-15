// Health assessment questionnaire — ported field-for-field from
// strengthiva-backend/static/test-ui.html (the reference implementation this
// backend's RAG pipeline is already exercised through). Field ids, option values,
// and conditional-visibility rules all match that file exactly — see
// app/services/profile_builder.py on the backend, which expects this exact
// vocabulary in the `answers` payload.
//
// Interaction pattern (progress bar, card-based options, contextual insight
// panels) follows the Figma "Assessment pages" export — see
// docs/platform-architecture/modules/app-frontend.md §4.

import type { Answers, FieldDef, StepDef } from "./questionnaire-types";

const isFemale = (a: Answers) => a["gender"] === "Female";

export const BASIC_INFO_STEP: StepDef = {
  id: "basic-info",
  title: "Basic Information",
  icon: "👤",
  fields: [
    { id: "name", label: "Full Name", type: "text", required: true, placeholder: "e.g. Priya Sharma" },
    { id: "age", label: "Age", type: "number", required: true, placeholder: "e.g. 35", min: 10, max: 110 },
    {
      id: "gender",
      label: "Gender",
      type: "radio",
      required: true,
      columns: 3,
      options: [
        { value: "Male", label: "Male" },
        { value: "Female", label: "Female" },
        { value: "Other", label: "Other" },
      ],
    },
    {
      id: "female-status",
      label: "Pregnancy / Reproductive Status",
      type: "radio",
      required: true,
      visibleIf: isFemale,
      options: [
        { value: "Pregnant", label: "Currently Pregnant" },
        { value: "Lactating", label: "Lactating" },
        { value: "Planning for conception", label: "Planning for Conception" },
        { value: "None", label: "None of these" },
      ],
    },
    {
      id: "menstrual-regularity",
      label: "Menstrual Regularity",
      sublabel: "Helps personalise your recommendations",
      type: "radio",
      required: true,
      visibleIf: isFemale,
      options: [
        { value: "Yes, regular", label: "Regular" },
        { value: "Slightly irregular", label: "Slightly irregular" },
        { value: "Irregular or missed periods", label: "Irregular / missed" },
        { value: "Very irregular or absent", label: "Very irregular / absent" },
      ],
    },
    // Height/weight/BMI is a special composite field, rendered by BmiField
    // (src/components/assessment/bmi-field.tsx) rather than the generic
    // renderer — kept out of this schema; the wizard wires it in directly.
    {
      id: "occupation",
      label: "Occupation",
      type: "select",
      required: true,
      options: [
        { value: "Student", label: "Student" },
        { value: "Desk job / Office work", label: "Desk job / Office work" },
        { value: "Physical labour", label: "Physical labour" },
        { value: "Homemaker", label: "Homemaker" },
        { value: "Business / Self-employed", label: "Business / Self-employed" },
        { value: "Healthcare worker", label: "Healthcare worker" },
        { value: "Retired", label: "Retired" },
        { value: "Other", label: "Other" },
      ],
    },
    {
      id: "occ-other",
      label: "Describe occupation",
      type: "text",
      placeholder: "Describe occupation…",
      visibleIf: (a) => a["occupation"] === "Other",
    },
  ],
};

export const LIFESTYLE_STEP: StepDef = {
  id: "lifestyle",
  title: "Lifestyle & Habits",
  icon: "🏃",
  fields: [
    {
      id: "exercise",
      label: "Exercise frequency",
      type: "radio",
      required: true,
      options: [
        { value: "More than 5 days a week", label: "5+ days/week" },
        { value: "3-5 days a week", label: "3–5 days/week" },
        { value: "1-2 days a week", label: "1–2 days/week" },
        { value: "Not so regular", label: "Not regular" },
      ],
    },
    {
      id: "dietary-type",
      label: "Diet type",
      type: "radio",
      required: true,
      options: [
        { value: "Vegetarian", label: "Vegetarian" },
        { value: "Non-vegetarian", label: "Non-vegetarian" },
        { value: "Vegan", label: "Vegan" },
        { value: "Eggetarian", label: "Eggetarian" },
      ],
    },
    {
      id: "dietary-habits",
      label: "Dietary habits",
      type: "radio",
      required: true,
      options: [
        { value: "Balanced and healthy", label: "Balanced & healthy" },
        { value: "Mostly healthy, occasional irregularities", label: "Mostly healthy" },
        { value: "Moderate / average diet", label: "Moderate / average" },
        { value: "Unhealthy or irregular eating habits", label: "Unhealthy / irregular" },
      ],
    },
    {
      id: "drink-daily",
      label: "Daily water intake",
      type: "radio",
      required: true,
      options: [
        { value: "Less than 1 litre", label: "<1 litre" },
        { value: "1-2 litres", label: "1–2 litres" },
        { value: "2-3 litres", label: "2–3 litres" },
        { value: "3 litres or more", label: "3+ litres" },
      ],
    },
    {
      id: "average-sleep",
      label: "Average sleep",
      type: "radio",
      required: true,
      options: [
        { value: "Less than 5 hours", label: "<5 hours" },
        { value: "5-6 hours", label: "5–6 hours" },
        { value: "7-8 hours", label: "7–8 hours" },
        { value: "More than 8 hours", label: "8+ hours" },
      ],
    },
    {
      id: "consume-alcohol",
      label: "Smoking / alcohol / substances",
      type: "radio",
      required: true,
      options: [
        { value: "Not applicable", label: "Not applicable" },
        { value: "Tried a couple of times, never a habit", label: "Tried, never habit" },
        { value: "Yes, was a regular habit for a few years", label: "Was regular, stopped" },
        { value: "Yes, it continues today", label: "Continues today" },
      ],
    },
    {
      id: "substance[]",
      label: "What? (select all)",
      type: "checkbox-group",
      visibleIf: (a) => a["consume-alcohol"] !== undefined && a["consume-alcohol"] !== "Not applicable",
      options: [
        { value: "Smoking", label: "Smoking" },
        { value: "Tobacco chewing", label: "Tobacco" },
        { value: "Alcohol", label: "Alcohol" },
        { value: "Caffeine", label: "Caffeine" },
        { value: "Drugs", label: "Drugs" },
      ],
    },
    {
      id: "drug-name",
      label: "Drug name (optional)",
      type: "text",
      placeholder: "Drug name (optional)",
      visibleIf: (a) =>
        a["consume-alcohol"] !== "Not applicable" && !!(a["substance[]"] as string[] | undefined)?.includes("Drugs"),
    },
  ],
};

export const PHYSICAL_HEALTH_STEP: StepDef = {
  id: "physical-health",
  title: "Physical Health",
  icon: "🩺",
  fields: [
    {
      id: "experience-fatigue",
      label: "Fatigue / low energy",
      type: "radio",
      required: true,
      options: [
        { value: "No", label: "No" },
        { value: "Mild", label: "Mild" },
        { value: "Moderate", label: "Moderate" },
        { value: "Severe", label: "Severe" },
      ],
    },
    {
      id: "common-illnesses",
      label: "History of chronic illness",
      type: "radio",
      required: true,
      options: [
        { value: "Yes, debilitating", label: "Yes, debilitating" },
        { value: "Yes, but manageable", label: "Yes, manageable" },
        { value: "Yes, short duration only", label: "Short duration only" },
        { value: "No", label: "No" },
      ],
    },
    {
      id: "illness-detail",
      label: "Describe illness",
      type: "text",
      placeholder: "Describe illness…",
      visibleIf: (a) => !!a["common-illnesses"] && a["common-illnesses"] !== "No",
    },
    {
      id: "appetite",
      label: "Appetite",
      type: "radio",
      required: true,
      options: [
        { value: "Eat when genuinely hungry", label: "Eat when hungry" },
        { value: "Hungry only for some meals", label: "Hungry for some meals" },
        { value: "Don't feel hungry, eat by clock", label: "Eat by the clock" },
        { value: "Don't feel hungry, eat erratically", label: "Erratic eating" },
      ],
    },
    {
      id: "bowel-movement",
      label: "Bowel movements",
      type: "radio",
      required: true,
      options: [
        { value: "Regular, complete emptying", label: "Regular, complete" },
        { value: "Regular, incomplete emptying", label: "Regular, incomplete" },
        { value: "Irregular, complete emptying", label: "Irregular, complete" },
        { value: "Irregular, incomplete emptying", label: "Irregular, incomplete" },
      ],
    },
    {
      id: "urine-flow",
      label: "Urine flow",
      type: "radio",
      required: true,
      options: [
        { value: "Normal all the time", label: "Normal always" },
        { value: "Normal but varies with fluids or travel", label: "Varies with fluids" },
        { value: "Regular but urgent", label: "Regular but urgent" },
        { value: "Less flow, burning, color change", label: "Less / burning / colour change" },
      ],
    },
    {
      id: "health-status",
      label: "Overall health status",
      type: "radio",
      required: true,
      options: [
        { value: "Healthy", label: "Healthy" },
        { value: "Healthy but on nutritional supplements", label: "Healthy, on supplements" },
        { value: "On medications to control disease", label: "On meds (controlled)" },
        { value: "On medications but disease not under control", label: "On meds (uncontrolled)" },
      ],
    },
    {
      id: "digestion",
      label: "Digestion",
      type: "radio",
      required: true,
      options: [
        { value: "Excellent", label: "Excellent" },
        { value: "Good", label: "Good" },
        { value: "Occasional issues", label: "Occasional issues" },
        { value: "Poor", label: "Poor" },
      ],
    },
    {
      id: "any-supplements",
      label: "Currently taking supplements / medicine?",
      type: "radio",
      required: true,
      options: [
        { value: "Yes", label: "Yes" },
        { value: "No", label: "No" },
      ],
    },
    {
      id: "supp-detail",
      label: "List supplements / medicines",
      type: "text",
      placeholder: "List supplements / medicines…",
      visibleIf: (a) => a["any-supplements"] === "Yes",
    },
    {
      id: "chronic[]",
      label: "Chronic conditions",
      sublabel: "Select all that apply — sub-questions will appear for each selected condition",
      type: "checkbox-group",
      required: true,
      options: [
        { value: "None", label: "None" },
        { value: "Diabetes", label: "Diabetes" },
        { value: "Hypertension/BP", label: "Hypertension / BP" },
        { value: "Thyroid dysfunction", label: "Thyroid dysfunction" },
        { value: "Kidney disease", label: "Kidney disease" },
        { value: "Obesity", label: "Obesity" },
        { value: "Low body weight", label: "Low body weight" },
        { value: "Sexual disability", label: "Sexual disability" },
        { value: "Menstrual disorder", label: "Menstrual disorder" },
        { value: "Infertility", label: "Infertility" },
        { value: "Respiratory issue", label: "Respiratory issue" },
        { value: "Gastro-intestinal issue", label: "Gastro-intestinal issue" },
        { value: "Musculo-skeletal issue", label: "Musculo-skeletal issue" },
        { value: "Skin and Hair disorders", label: "Skin & Hair" },
        { value: "Cancer", label: "Cancer" },
        { value: "Cardiovascular disease", label: "Cardiovascular" },
        { value: "Liver disorders", label: "Liver disorders" },
        { value: "Neurological disorders", label: "Neurological" },
        { value: "Substance dependence", label: "Substance dependence" },
      ],
    },
  ],
};

export const MENTAL_WELLNESS_STEP: StepDef = {
  id: "mental-wellness",
  title: "Mental Wellness",
  icon: "🧘",
  fields: [
    {
      id: "feel-stressed",
      label: "Stress level",
      type: "radio",
      required: true,
      options: [
        { value: "Rarely", label: "Rarely" },
        { value: "Sometimes", label: "Sometimes" },
        { value: "Often", label: "Often" },
        { value: "Almost always", label: "Almost always" },
      ],
    },
    { id: "mood-rate", label: "Mood on most days", type: "slider", min: 1, max: 10 },
    {
      id: "emotional-fatigue",
      label: "Emotional fatigue / burnout",
      type: "radio",
      required: true,
      options: [
        { value: "Never", label: "Never" },
        { value: "Rarely", label: "Rarely" },
        { value: "Sometimes", label: "Sometimes" },
        { value: "Frequently", label: "Frequently" },
      ],
    },
    {
      id: "emotional-desc",
      label: "Describe what you experience",
      type: "textarea",
      placeholder: "Describe what you experience…",
      visibleIf: (a) => a["emotional-fatigue"] === "Sometimes" || a["emotional-fatigue"] === "Frequently",
    },
  ],
};

export const MEDICAL_HISTORY_STEP: StepDef = {
  id: "medical-history",
  title: "Medical History",
  icon: "📋",
  fields: [
    {
      id: "last-medical",
      label: "Last medical check-up",
      type: "radio",
      required: true,
      options: [
        { value: "Within 6 months", label: "Within 6 months" },
        { value: "6-12 months ago", label: "6–12 months ago" },
        { value: "1-2 years ago", label: "1–2 years ago" },
        { value: "More than 2 years ago", label: "2+ years ago" },
        { value: "Never", label: "Never" },
      ],
    },
    {
      id: "blood-pressure",
      label: "High BP or high cholesterol?",
      type: "radio",
      required: true,
      columns: 3,
      options: [
        { value: "Yes", label: "Yes" },
        { value: "No", label: "No" },
        { value: "Not sure", label: "Not sure" },
      ],
    },
    {
      id: "family-history[]",
      label: "Family medical history (select all)",
      type: "checkbox-group",
      required: true,
      options: [
        { value: "Diabetes", label: "Diabetes" },
        { value: "Heart disease", label: "Heart disease" },
        { value: "Cancer", label: "Cancer" },
        { value: "Thyroid disorder", label: "Thyroid" },
        { value: "High BP or cholesterol", label: "High BP / cholesterol" },
        { value: "None of the above", label: "None" },
      ],
    },
  ],
};

export const GOALS_STEP: StepDef = {
  id: "goals",
  title: "Goals & Preferences",
  icon: "🎯",
  fields: [
    {
      id: "health-goal[]",
      label: "Primary health goals (select all)",
      type: "checkbox-group",
      required: true,
      options: [
        { value: "Lose weight", label: "Lose weight" },
        { value: "Build strength", label: "Build strength" },
        { value: "Improve immunity", label: "Improve immunity" },
        { value: "Better sleep", label: "Better sleep" },
        { value: "Manage stress", label: "Manage stress" },
        { value: "Boost energy", label: "Boost energy" },
      ],
    },
    {
      id: "your-lifestyle[]",
      label: "Current lifestyle (select all)",
      type: "checkbox-group",
      required: true,
      options: [
        { value: "Sedentary / mostly sitting", label: "Sedentary" },
        { value: "Work from home", label: "Work from home" },
        { value: "Active outdoors", label: "Active outdoors" },
        { value: "Frequent travel", label: "Frequent travel" },
        { value: "Irregular meals", label: "Irregular meals" },
        { value: "High screen time", label: "High screen time" },
      ],
    },
    {
      id: "health-supplements",
      label: "Open to supplements?",
      type: "radio",
      required: true,
      options: [
        { value: "Yes, definitely", label: "Yes, definitely" },
        { value: "Maybe", label: "Maybe" },
        { value: "Not sure", label: "Not sure" },
        { value: "No", label: "No" },
      ],
    },
  ],
};

// Disease-specific steps, keyed by the exact "chronic[]" option value that
// triggers them — mirrors test-ui.html's diseaseMap (test-ui.html:1516-1523).
export const DISEASE_STEPS: Record<string, StepDef> = {
  Diabetes: {
    id: "disease-diabetes",
    title: "Diabetes",
    icon: "🩸",
    fields: [
      radio("d-duration", "Duration", [
        ["Less than 1 year", "<1 year"], ["1-3 years", "1–3 yrs"], ["4-7 years", "4–7 yrs"], ["8 years or more", "8+ yrs"],
      ]),
      radio("d-type", "Type", [["Type 1", "Type 1"], ["Type 2", "Type 2"], ["Gestational", "Gestational"]], 3),
      radio("d-medication", "Medication", [
        ["Diet and lifestyle only", "Diet & lifestyle only"], ["Oral medications", "Oral meds"],
        ["Insulin therapy", "Insulin"], ["Oral + Insulin combination", "Oral + Insulin"],
      ]),
      radio("d-hba1c", "HbA1c", [
        ["Less than 6.5%", "<6.5%"], ["6.5%-7.9%", "6.5–7.9%"], ["8.0%-9.9%", "8.0–9.9%"], ["10% or higher", "10%+"],
      ]),
      radio("d-lowsugar", "Low blood sugar episodes", [
        ["No", "No"], ["Once or twice a month", "1–2×/month"], ["Weekly once or twice", "Weekly"], ["Daily", "Daily"],
      ]),
      radio("d-complications", "Complications", [
        ["No complications", "None"], ["Mild complications", "Mild"], ["Moderate complications", "Moderate"], ["Severe complications", "Severe"],
      ]),
    ],
  },
  "Hypertension/BP": {
    id: "disease-hypertension",
    title: "Hypertension / BP",
    icon: "💓",
    fields: [
      radio("h-duration", "Duration", [
        ["Less than 1 year ago", "<1 year"], ["1-4 years ago", "1–4 yrs"], ["5-9 years ago", "5–9 yrs"], ["10 years or more ago", "10+ yrs"],
      ]),
      radio("h-highest-bp", "Highest BP reading", [
        ["Less than 140/90", "<140/90"], ["140/90 to 159/99", "140–159/90–99"],
        ["160/100 to 179/109", "160–179/100–109"], ["180/110 or higher", "180/110+"],
      ]),
      radio("h-cholesterol", "Cholesterol", [
        ["No, never", "Normal"], ["Yes, controlled with diet/exercise", "High, diet-controlled"],
        ["Yes, on medication", "High, on medication"], ["Yes, high despite medication", "High despite meds"],
      ]),
      radio("h-medication", "BP medication", [
        ["No medication, under control", "No meds, controlled"], ["Lifestyle changes only", "Lifestyle only"],
        ["One BP medication", "1 medication"], ["Two or more BP medications", "2+ medications"],
      ]),
    ],
  },
  "Thyroid dysfunction": {
    id: "disease-thyroid",
    title: "Thyroid Dysfunction",
    icon: "🦋",
    fields: [
      radio("t-weight", "Unexplained weight changes (6 months)", [
        ["No unexplained changes", "None"], ["Mild change up to 5kg", "Mild (<5kg)"],
        ["Moderate change 5-10kg", "Moderate (5–10kg)"], ["Severe change more than 10kg", "Severe (10kg+)"],
      ]),
      radio("t-fatigue", "Thyroid-related fatigue", [
        ["No unusual fatigue", "None"], ["Mild, occasional", "Mild"], ["Moderate, affects daily activities", "Moderate"], ["Severe, persistent", "Severe"],
      ]),
      radio("t-skin", "Dry skin / brittle nails / thinning hair", [
        ["No such symptoms", "None"], ["Mild changes", "Mild"], ["Moderate changes", "Moderate"], ["Severe changes", "Severe"],
      ]),
      radio("t-cold", "Cold extremities", [
        ["No, feel normal", "Normal"], ["Mild or occasional", "Mild"], ["Frequent, causing discomfort", "Frequent"], ["Persistent, severe", "Persistent"],
      ]),
    ],
  },
  "Kidney disease": {
    id: "disease-kidney",
    title: "Kidney Disease",
    icon: "🫘",
    fields: [
      radio("k-edema", "Pitting edema (swelling)", [
        ["No swelling", "None"], ["Mild, occasional", "Mild"], ["Moderate, persistent", "Moderate"], ["Severe, widespread", "Severe"],
      ]),
      radio("k-urine", "Urination difficulty", [
        ["No difficulty", "None"], ["Mild difficulty", "Mild"], ["Moderate, less urine output", "Moderate"], ["Severe, very little urine", "Severe"],
      ]),
      radio("k-creatinine", "Creatinine level", [
        ["Less than 1.2 mg/dL", "<1.2"], ["1.2-1.5 mg/dL", "1.2–1.5"], ["1.6-2.5 mg/dL", "1.6–2.5"], ["More than 2.5 mg/dL", ">2.5"],
      ]),
      radio("k-protein", "Protein/blood in urine", [
        ["No protein or blood", "No"], ["Trace or occasional", "Trace"], ["Persistent", "Persistent"], ["High levels or diagnosed damage", "High / diagnosed"],
      ]),
    ],
  },
  Obesity: {
    id: "disease-obesity",
    title: "Obesity",
    icon: "⚖️",
    fields: [
      radio("ob-cause", "Cause", [
        ["Lifestyle factors", "Lifestyle"], ["Lifestyle and genetics", "Lifestyle + genetics"],
        ["Hormonal imbalance", "Hormonal (thyroid/PCOS)"], ["Hormonal imbalance with improper diet", "Hormonal + diet"],
      ]),
      radio("ob-dinner", "Dinner time", [
        ["7-8 pm", "7–8 pm"], ["8-9 pm", "8–9 pm"], ["9-10 pm", "9–10 pm"], ["Beyond 10 pm", "After 10 pm"],
      ]),
    ],
  },
  "Low body weight": {
    id: "disease-underweight",
    title: "Low Body Weight",
    icon: "🏃",
    fields: [
      radio("uw-loss", "Unintentional weight loss (6 months)", [
        ["No", "No"], ["1-3 kg", "1–3 kg"], ["4-6 kg", "4–6 kg"], ["More than 6 kg", ">6 kg"],
      ]),
      radio("uw-restriction", "Food restriction", [
        ["Eat without limiting food", "No restriction"], ["Sometimes restrict, not regularly", "Sometimes"],
        ["Frequently limit food", "Frequently"], ["Consistently restrict most of the time", "Consistently"],
      ]),
      radio("uw-muscle", "Muscle loss", [
        ["No loss", "No loss"], ["Mild decrease in tone", "Mild"], ["Clear muscle thinning", "Clear thinning"], ["Marked muscle wasting", "Marked wasting"],
      ]),
    ],
  },
  "Sexual disability": {
    id: "disease-sexual",
    title: "Sexual Health",
    icon: "🫀",
    fields: [
      checkboxGroup("sx-concern[]", "Primary concern (select all)", [
        ["Erectile Dysfunction", "Erectile Dysfunction"], ["Loss of Libido", "Loss of Libido"], ["Infertility", "Infertility"],
        ["Premature ejaculation", "Premature ejaculation"], ["Chronic Fatigue", "Chronic Fatigue"], ["Nightfall", "Nightfall"],
      ]),
      radio("sx-drive", "Sex drive", [
        ["Regular and healthy", "Regular & healthy"], ["Low interest, infrequent", "Low"], ["No interest", "None"], ["Very high or constant", "Very high"],
      ]),
    ],
  },
  "Menstrual disorder": {
    id: "disease-menstrual",
    title: "Menstrual Disorders",
    icon: "🌸",
    fields: [
      radio("mn-pain", "Lower abdomen pain during periods", [
        ["No pain", "None"], ["Mild, manageable without medication", "Mild"],
        ["Moderate, requires medication or rest", "Moderate"], ["Severe, interferes with daily activities", "Severe"],
      ]),
      radio("mn-cycle", "Cycle length", [
        ["Regular 21-35 days", "Regular (21–35 days)"], ["Slightly irregular varies 3-7 days", "Slightly irregular"],
        ["Irregular shorter than 21 or longer than 35 days", "Irregular"], ["Highly irregular or absent", "Highly irregular"],
      ]),
      radio("mn-flow", "Flow", [
        ["Normal flow", "Normal"], ["Mildly heavy or light", "Mildly heavy/light"],
        ["Heavy or very light", "Heavy / very light"], ["Very heavy soaking pads hourly", "Very heavy"],
      ]),
      radio("mn-pms", "PMS symptoms", [["No", "No"], ["Yes", "Yes"]]),
      checkboxGroup("mn-gynae[]", "Gynaecological conditions (select all)", [
        ["Adenomyosis", "Adenomyosis"], ["Uterine fibroids", "Uterine fibroids"], ["Endometriosis", "Endometriosis"],
        ["PCOS", "PCOS"], ["Ovarian cysts", "Ovarian cysts"], ["Pelvic inflammatory disease", "PID"], ["None", "None"],
      ]),
    ],
  },
  Infertility: {
    id: "disease-infertility",
    title: "Infertility",
    icon: "👶",
    fields: [
      radio("if-trying", "Trying to conceive since", [
        ["Less than 6 months", "<6 months"], ["6 months to 1 year", "6m–1yr"], ["1-2 years", "1–2 yrs"], ["More than 2 years", "2+ yrs"],
      ]),
      radio("if-conception", "Conception / miscarriage history", [
        ["No previous conception", "No conception"], ["Conceived, no miscarriage", "Conceived, no loss"],
        ["One miscarriage", "1 miscarriage"], ["Two or more miscarriages", "2+ miscarriages"],
      ]),
      radio("if-treatment", "Fertility treatment history", [
        ["No treatment", "None"], ["Fertility medications only", "Medications"], ["IUI", "IUI"], ["IVF or advanced procedures", "IVF / Advanced"],
      ]),
    ],
  },
  "Respiratory issue": {
    id: "disease-respiratory",
    title: "Respiratory Issues",
    icon: "🫁",
    fields: [
      radio("rs-breath", "Shortness of breath", [
        ["Never", "Never"], ["Only when walking fast or uphill", "On exertion"],
        ["When walking at normal pace", "Normal walking"], ["Even during daily activities or at rest", "At rest"],
      ]),
      radio("rs-wheeze", "Wheezing", [
        ["Never", "Never"], ["Occasionally", "Occasionally"], ["Frequently", "Frequently"], ["Almost always", "Almost always"],
      ]),
      checkboxGroup("rs-conditions[]", "Conditions (select all)", [
        ["Asthma", "Asthma"], ["Chronic Bronchitis", "Bronchitis"], ["Tuberculosis", "Tuberculosis"], ["Pneumonia", "Pneumonia"], ["None", "None"],
      ]),
    ],
  },
  "Gastro-intestinal issue": {
    id: "disease-gastro",
    title: "Gastro-Intestinal",
    icon: "🫃",
    fields: [
      radio("gi-bloating", "Bloating / heartburn / sour belches", [
        ["Never", "Never"], ["Sometimes", "Sometimes"], ["Often", "Often"], ["Always", "Always"],
      ]),
      radio("gi-abdominal", "Abdominal pain", [
        ["Never", "Never"], ["Occasionally, mild", "Occasionally"], ["Frequently, moderate", "Frequently"], ["Severe or daily", "Severe / daily"],
      ]),
      checkboxGroup("gi-conditions[]", "Symptoms (select all)", [
        ["Acid reflux/GERD", "Acid reflux/GERD"], ["Constipation", "Constipation"], ["Diarrhea", "Diarrhea"],
        ["Abdominal bloating", "Bloating"], ["Excessive gas", "Excessive gas"], ["Hemorrhoids", "Hemorrhoids"], ["None", "None"],
      ]),
    ],
  },
  "Musculo-skeletal issue": {
    id: "disease-musculo",
    title: "Musculo-Skeletal",
    icon: "🦴",
    fields: [
      radio("ms-pain", "Joint pain", [
        ["No joint pain", "None"], ["Mild, occasional", "Mild"], ["Moderate, frequent", "Moderate"], ["Severe, constant or disabling", "Severe"],
      ]),
      radio("ms-stiffness", "Morning stiffness", [
        ["No stiffness", "None"], ["Mild, less than 15 minutes", "<15 min"], ["Moderate, 15-60 minutes", "15–60 min"], ["Severe, more than 60 minutes", "60+ min"],
      ]),
      radio("ms-fracture", "Fracture from minor bump", [["Yes", "Yes"], ["No", "No"]]),
    ],
  },
  "Skin and Hair disorders": {
    id: "disease-skin",
    title: "Skin & Hair",
    icon: "🧴",
    fields: [
      radio("sk-type", "Skin type", [
        ["Normal skin", "Normal"], ["Dry skin", "Dry"], ["Oily skin", "Oily"], ["Combination skin", "Combination"], ["Sensitive skin", "Sensitive"],
      ], 3),
      checkboxGroup("sk-concern[]", "Skin concerns (select all)", [
        ["Acne", "Acne"], ["Melasma", "Melasma"], ["Psoriasis", "Psoriasis"],
        ["Hyperpigmentation", "Hyperpigmentation"], ["Rashes or allergic reactions", "Rashes / allergy"], ["No major skin issues", "None major"],
      ]),
      radio("hr-fall", "Hair fall duration", [
        ["Not applicable", "N/A"], ["Less than 6 months", "<6 months"], ["6 months to 2 years", "6m–2 yrs"], ["More than 2 years", "2+ yrs"],
      ]),
      radio("hr-dandruff", "Dandruff", [["Yes", "Yes"], ["No", "No"]]),
    ],
  },
  Cancer: {
    id: "disease-cancer",
    title: "Cancer",
    icon: "🎗️",
    fields: [
      radio("ca-interference", "Interference with daily activities", [
        ["No interference", "None"], ["Mild interference", "Mild"], ["Moderate to significant", "Moderate"], ["Severe, constant", "Severe"],
      ]),
      radio("ca-stage", "Stage", [
        ["Early / in situ", "In situ"], ["Early stage", "Early"], ["Moderately advanced", "Moderate"], ["Advanced", "Advanced"],
      ]),
    ],
  },
  "Cardiovascular disease": {
    id: "disease-heart",
    title: "Cardiovascular",
    icon: "❤️",
    fields: [
      radio("hd-family", "Family history of heart disease", [
        ["No family history", "None"], ["One relative aged 60 or above", "Relative 60+"],
        ["One relative under 60", "Relative <60"], ["Two or more relatives under 60", "2+ relatives <60"],
      ]),
      checkboxGroup("hd-symptoms[]", "Symptoms (select all)", [
        ["Chest pain", "Chest pain"], ["Trouble breathing", "Trouble breathing"], ["Dizziness or lightheaded", "Dizziness"],
        ["Heart fluttering", "Palpitations"], ["Unusual fatigue", "Unusual fatigue"], ["None", "None"],
      ]),
      radio("hd-attacks", "Heart attacks", [
        ["None", "None"], ["One", "One"], ["Two", "Two"], ["Three or more", "Three+"],
      ]),
    ],
  },
  "Liver disorders": {
    id: "disease-liver",
    title: "Liver Disorders",
    icon: "🟤",
    fields: [
      radio("lv-fatigue", "Fatigue / weakness", [
        ["No fatigue, normal energy", "None"], ["Mild, doesn't affect daily activities", "Mild"],
        ["Moderate, limits some activities", "Moderate"], ["Severe, interferes with most activities", "Severe"],
      ]),
      radio("lv-jaundice", "Jaundice", [["Yes", "Yes"], ["No", "No"]]),
      checkboxGroup("lv-conditions[]", "Diagnosed conditions (select all)", [
        ["Hepatitis", "Hepatitis"], ["Fatty Liver (NAFLD/MASLD)", "Fatty Liver"], ["Cirrhosis", "Cirrhosis"], ["None", "None"],
      ]),
    ],
  },
  "Neurological disorders": {
    id: "disease-neuro",
    title: "Neurological",
    icon: "🧠",
    fields: [
      radio("nr-memory", "Memory concerns", [["Yes", "Yes"], ["No", "No"]]),
      checkboxGroup("nr-changes[]", "Memory/thinking changes (select all)", [
        ["Forgetting names", "Forgetting names"], ["Trouble with appointments", "Trouble with appointments"],
        ["Difficulty finding words", "Finding words"], ["Getting lost in familiar places", "Getting lost"], ["None", "None"],
      ]),
      radio("nr-anxiety", "Anxiety / on edge", [
        ["Not at all", "Not at all"], ["Occasionally, manageable", "Occasionally"],
        ["Often, affects daily activities", "Often"], ["Nearly all the time", "Nearly always"],
      ]),
    ],
  },
  "Substance dependence": {
    id: "disease-substance",
    title: "Substance Dependence",
    icon: "🚭",
    fields: [
      radio("su-frequency", "Alcohol frequency (last 3 months)", [
        ["Did not drink", "Did not drink"], ["Occasionally (social)", "Occasionally"],
        ["Regularly (weekly or more)", "Regularly"], ["Heavily or almost daily", "Heavily / daily"],
      ]),
      radio("su-withdrawal", "Withdrawal symptoms when stopped", [["Yes", "Yes"], ["No", "No"]]),
    ],
  },
};

// The 18 chronic[] values that map to a DISEASE_STEPS entry, in the same order
// test-ui.html's diseaseMap declares them — determines the order dynamic steps
// are inserted in when multiple conditions are selected.
export const CHRONIC_CONDITION_ORDER = [
  "Diabetes", "Hypertension/BP", "Thyroid dysfunction", "Kidney disease", "Obesity",
  "Low body weight", "Sexual disability", "Menstrual disorder", "Infertility",
  "Respiratory issue", "Gastro-intestinal issue", "Musculo-skeletal issue",
  "Skin and Hair disorders", "Cancer", "Cardiovascular disease", "Liver disorders",
  "Neurological disorders", "Substance dependence",
];

export const FIXED_STEPS_BEFORE_DISEASE_BLOCKS: StepDef[] = [
  BASIC_INFO_STEP,
  LIFESTYLE_STEP,
  PHYSICAL_HEALTH_STEP,
];

export const FIXED_STEPS_AFTER_DISEASE_BLOCKS: StepDef[] = [
  MENTAL_WELLNESS_STEP,
  MEDICAL_HISTORY_STEP,
  GOALS_STEP,
];

/** Builds the full, current step list — grows as chronic[] selections change. */
export function buildSteps(answers: Answers): StepDef[] {
  const selected = (answers["chronic[]"] as string[] | undefined) ?? [];
  const diseaseSteps = CHRONIC_CONDITION_ORDER.filter((c) => selected.includes(c)).map(
    (c) => DISEASE_STEPS[c],
  );
  return [...FIXED_STEPS_BEFORE_DISEASE_BLOCKS, ...diseaseSteps, ...FIXED_STEPS_AFTER_DISEASE_BLOCKS];
}

// ── small helpers to keep the disease-step definitions above terse ──────────

function radio(id: string, label: string, pairs: [string, string][], columns: 2 | 3 = 2): FieldDef {
  return {
    id,
    label,
    type: "radio",
    columns,
    options: pairs.map(([value, optLabel]) => ({ value, label: optLabel })),
  };
}

function checkboxGroup(id: string, label: string, pairs: [string, string][]): FieldDef {
  return {
    id,
    label,
    type: "checkbox-group",
    options: pairs.map(([value, optLabel]) => ({ value, label: optLabel })),
  };
}
