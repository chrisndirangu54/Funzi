/** Server-side allowed pathway metadata. Synced against src/homeschoolCurricula.ts in tests. */
export const homeschoolCatalog:Record<string,{stages:string[];subjects:string[];language:string[]}>={
  "kenya-cbe": {
    "stages": [
      "Pre-primary",
      "Primary",
      "Junior School",
      "Senior School"
    ],
    "subjects": [
      "Mathematics",
      "English",
      "Kiswahili",
      "Integrated Science",
      "Social Studies",
      "Agriculture",
      "Creative Arts"
    ],
    "language": [
      "English",
      "Kiswahili"
    ]
  },
  "kenya-844": {
    "stages": [
      "KCSE revision",
      "Transition support"
    ],
    "subjects": [
      "Mathematics",
      "English",
      "Kiswahili",
      "Biology",
      "Chemistry",
      "Physics",
      "History"
    ],
    "language": [
      "English",
      "Kiswahili"
    ]
  },
  "cambridge": {
    "stages": [
      "Primary",
      "Lower Secondary",
      "IGCSE",
      "AS & A Level"
    ],
    "subjects": [
      "Mathematics",
      "English",
      "Sciences",
      "Computer Science",
      "Economics"
    ],
    "language": [
      "English"
    ]
  },
  "pearson-edexcel": {
    "stages": [
      "International GCSE",
      "International A Level"
    ],
    "subjects": [
      "Mathematics",
      "English",
      "Sciences",
      "Business"
    ],
    "language": [
      "English"
    ]
  },
  "ib": {
    "stages": [
      "PYP",
      "MYP",
      "DP",
      "CP"
    ],
    "subjects": [
      "Language",
      "Mathematics",
      "Sciences",
      "Individuals and Societies",
      "Arts"
    ],
    "language": [
      "English",
      "Kiswahili enrichment"
    ]
  },
  "us-common-core": {
    "stages": [
      "Kindergarten",
      "Grades 1–5",
      "Grades 6–8",
      "High School"
    ],
    "subjects": [
      "Mathematics",
      "English Language Arts"
    ],
    "language": [
      "English"
    ]
  },
  "us-ngss": {
    "stages": [
      "Kindergarten",
      "Elementary",
      "Middle School",
      "High School"
    ],
    "subjects": [
      "Life Science",
      "Physical Science",
      "Earth and Space Science",
      "Engineering"
    ],
    "language": [
      "English"
    ]
  },
  "us-ap": {
    "stages": [
      "High School AP"
    ],
    "subjects": [
      "Calculus",
      "Biology",
      "Chemistry",
      "Computer Science",
      "Physics"
    ],
    "language": [
      "English"
    ]
  },
  "china-national": {
    "stages": [
      "Primary",
      "Junior Secondary",
      "Senior Secondary"
    ],
    "subjects": [
      "Chinese Language",
      "Mathematics",
      "Science",
      "English",
      "History"
    ],
    "language": [
      "Mandarin Chinese",
      "English",
      "Kiswahili enrichment"
    ]
  },
  "british-national": {
    "stages": [
      "Key Stage 1",
      "Key Stage 2",
      "Key Stage 3",
      "Key Stage 4"
    ],
    "subjects": [
      "English",
      "Mathematics",
      "Science",
      "Computing",
      "History"
    ],
    "language": [
      "English"
    ]
  },
  "montessori": {
    "stages": [
      "Early years",
      "Primary"
    ],
    "subjects": [
      "Practical Life",
      "Language",
      "Mathematics",
      "Sensorial",
      "Culture"
    ],
    "language": [
      "English",
      "Kiswahili"
    ]
  },
  "waldorf": {
    "stages": [
      "Early years",
      "Primary",
      "Secondary"
    ],
    "subjects": [
      "Literacy",
      "Numeracy",
      "Arts",
      "Nature Studies"
    ],
    "language": [
      "English",
      "Kiswahili"
    ]
  },
  "india-cbse": {
    "stages": [
      "Primary",
      "Middle School",
      "Class IX",
      "Class X",
      "Class XI",
      "Class XII"
    ],
    "subjects": [
      "Mathematics",
      "English",
      "Hindi",
      "Science",
      "Social Science",
      "Computer Science"
    ],
    "language": [
      "English",
      "Hindi"
    ]
  },
  "singapore-moe": {
    "stages": [
      "Primary 1–3",
      "Primary 4–6",
      "Secondary"
    ],
    "subjects": [
      "Mathematics",
      "English",
      "Science",
      "Mother Tongue",
      "Social Studies"
    ],
    "language": [
      "English",
      "Mandarin Chinese"
    ]
  },
  "south-africa-caps": {
    "stages": [
      "Foundation Phase",
      "Intermediate Phase",
      "Senior Phase",
      "FET Phase"
    ],
    "subjects": [
      "Mathematics",
      "English",
      "Natural Sciences",
      "Social Sciences",
      "Life Skills"
    ],
    "language": [
      "English"
    ]
  },
  "australian-curriculum": {
    "stages": [
      "Foundation",
      "Years 1–6",
      "Years 7–10"
    ],
    "subjects": [
      "English",
      "Mathematics",
      "Science",
      "Humanities and Social Sciences",
      "Technologies",
      "The Arts"
    ],
    "language": [
      "English"
    ]
  },
  "canada-ontario": {
    "stages": [
      "Kindergarten",
      "Grades 1–3",
      "Grades 4–6",
      "Grades 7–8",
      "Grades 9–12"
    ],
    "subjects": [
      "Mathematics",
      "Language",
      "Science and Technology",
      "Social Studies",
      "The Arts"
    ],
    "language": [
      "English"
    ]
  },
  "new-zealand": {
    "stages": [
      "Years 0–3",
      "Years 4–6",
      "Years 7–8",
      "Years 9–10",
      "Years 11–13"
    ],
    "subjects": [
      "English",
      "Mathematics",
      "Science",
      "Social Sciences",
      "Technology",
      "The Arts"
    ],
    "language": [
      "English"
    ]
  },
  "france-national": {
    "stages": [
      "Cycle 1",
      "Cycle 2",
      "Cycle 3",
      "Cycle 4",
      "Lycée"
    ],
    "subjects": [
      "Français",
      "Mathématiques",
      "Sciences",
      "Histoire-Géographie",
      "Langues vivantes"
    ],
    "language": [
      "French",
      "English enrichment"
    ]
  }
};
export function isValidHomeLearningCatalogChoice(x:{pathway:string;stage:string;subjects:string[];language:string}):boolean{
 const item=homeschoolCatalog[x.pathway];
 return !!item&&item.stages.includes(x.stage)&&item.language.includes(x.language)&&x.subjects.length>0&&x.subjects.every(s=>item.subjects.includes(s));
}
