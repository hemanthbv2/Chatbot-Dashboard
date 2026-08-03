/**
 * RVGHS Chatbot — Knowledge Base & Conversation Flow Data
 * Source: rvghs.edu.in + PDF instructions
 */

/**
 * ═══════════════════════════════════════════════════════════════
 * GOOGLE SHEETS INTEGRATION
 * ═══════════════════════════════════════════════════════════════
 * Replace the URL below with your deployed Google Apps Script URL.
 * See google-apps-script.js for setup instructions.
 * If left empty, form data will only be shown in chat (no backend).
 * ═══════════════════════════════════════════════════════════════
 */
const GOOGLE_SHEETS_URL = (window.rvghsChatbotSettings && window.rvghsChatbotSettings.googleSheetsUrl)
  ? window.rvghsChatbotSettings.googleSheetsUrl
  : 'https://script.google.com/macros/s/AKfycbweu2IVU6J23Dh9_nai5EmwFsjipR3HJmSMSh5ROOk-jcznWhha1Ng2c6WdizFWtYmA/exec';

const RVGHS_DATA = {

  // ─── College Info ────────────────────────────────────────────
  college: {
    name: "RV Girls High School",
    shortName: "RVGHS",
    established: 2003,
    affiliation: "Rajiv Gandhi University of Health Sciences (RGUHS)",
    recognitions: ["Indian Nursing Council", "Karnataka Nursing Council"],
    address: `<a href="https://www.google.com/maps/search/?api=1&query=RV+College+of+Nursing+Jayanagar+Bengaluru" target="_blank" style="color: #3b82f6; text-decoration: underline;">CA 2/83-3, 9th Main Rd, Behind Jain Temple, 4th T Block East, 4th Block, Jayanagar, Bengaluru, Karnataka-560011 📍</a>`,
    location: "Jayanagar 4th Block, Bengaluru",
    locationHighlight: "Minute's walk from bus terminus, easy metro access 🚇",
    website: "https://rvghs.edu.in/",
    admissionPortal: "https://wds-prd.rvei.edu.in:4430/sap/bc/ui5_ui5/sap/zrvihlthscience/index.html#/Scode/RVGHS",
    googleMapsLink: "https://www.google.com/maps/search/?api=1&query=RV+College+of+Nursing+Jayanagar+Bengaluru",
    phone: {
      office: "080-68917100",
      mobile1: "9036876172",
      mobile2: "9448406646",
      alternates: ["080-68917101", "080-68917102"]
    },
    social: {
      facebook: "https://www.facebook.com/profile.php?id=61552955893886",
      linkedin: "https://www.linkedin.com/company/98823851/admin/feed/posts/",
      twitter: "https://twitter.com/rvcollegeofnsg",
      instagram: "https://www.instagram.com/rvghs_rvcollegeofnursing/",
      youtube: "https://www.youtube.com/channel/UCxCrdnb7iPgYpjOThwdU83g/videos",
      pinterest: "https://www.pinterest.com/rvghscollege/",
      spotify: "https://podcasters.spotify.com/pod/show/r-v-college-of-nursing"
    },
    leadership: {
      president: { name: "Dr. M.P. Shyam", role: "President, RVEI" },
      secretary: { name: "Dr.(h.c). A.V.S. Murthy", role: "Hon. Secretary, RVEI" },
      jointSecretary: { name: "Mr. D.P. Nagaraj", role: "Hon. Joint Secretary, RVEI" },
      principal: { name: "Dr. S. R. Gajendra Singh", role: "Principal, RVGHS" }
    }
  },

  // ─── Seats Overview ──────────────────────────────────────────
  seats: {
    total: 85,
    breakdown: [
      { programme: "B.Sc. Nursing", seats: 60 },
      { programme: "M.Sc. Nursing", seats: 25 },
      { programme: "NPCC", seats: 15 }
    ]
  },

  // ─── Programmes ──────────────────────────────────────────────
  programmes: {
    bsc: {
      name: "B.Sc. Nursing",
      duration: "4 Years",
      seats: 60,
      type: "Undergraduate",
      tagline: "Government-Approved Private Institution with Strong Clinical Exposure",
      description: "The B.Sc. Nursing programme at RVGHS stands out as a premier choice for aspiring nurses seeking a transformative education. Our programme combines academic excellence with practical, hands-on experience, preparing students not only for successful licensure but also for leadership roles in the dynamic field of healthcare. Renowned faculty members guide students through a curriculum that emphasises critical thinking, evidence-based practice, and compassionate patient care.",
      aims: [
        "Equip graduates to serve as proficient nurses and midwives confidently in providing preventive, curative, and rehabilitative services.",
        "Prepare nurses who can make independent decisions in various nursing scenarios, safeguarding individual and group rights.",
        "Prepare students to function effectively in both hospital and community nursing contexts, and encourage involvement in research.",
        "Cultivate the capacity for graduates to embrace roles as educators, supervisors, and managers within the clinical and public health domains."
      ],
      eligibility: {
        education: "Successful completion of 10+2 or equivalent examination",
        marks: {
          general: "Minimum 50% marks in PCB (Physics, Chemistry, Biology)",
          reserved: "Minimum 40% marks in PCB for reserved category"
        },
        age: "At least 17 years as of August 31 of admission year",
        nri: "NRIs and foreign nationals admitted based on core subject performance",
        admission: "Based on merit of previous qualifying examination"
      },
      admissionTimeline: [
        "Application forms available: April – May",
        "Selection process: June – July",
        "Admissions finalised: By September"
      ],
      careerPaths: [
        "Staff Nurse in Reputed Hospitals",
        "Nursing Officer in Government Sectors",
        "Military Nursing Services",
        "Community Health Nurse",
        "Nursing Tutor / Clinical Instructor",
        "Opportunities Abroad"
      ],
      link: "https://rvghs.edu.in/programmes/#BSC"
    },

    msc: {
      name: "M.Sc. Nursing",
      duration: "2 Years",
      seats: 25,
      type: "Postgraduate",
      tagline: "Advanced Postgraduate Programme for Nursing Excellence",
      description: "The postgraduate programme is meticulously crafted to enhance nursing education and practice quality across India. This advanced course builds upon the foundational knowledge gained at the graduate level, focusing on applying pertinent theories to nursing practice, education, administration, and research skill development.",
      aim: "To provide graduates with the knowledge and skills necessary to work successfully as nurse specialists, consultants, educators, and administrators in a variety of professional fields.",
      specializations: [
        { name: "Medical Surgical Nursing", seats: 5 },
        { name: "Obstetrics & Gynaecological Nursing (OBG)", seats: 5 },
        { name: "Paediatric Nursing", seats: 5 },
        { name: "Psychiatric/Mental Health Nursing", seats: 5 },
        { name: "Community Health Nursing", seats: 5 }
      ],
      eligibility: {
        education: "Bachelor's degree in Nursing (B.Sc. Nursing or P.B.B.Sc Nursing)",
        marks: "Minimum 55% marks in B.Sc. (N) or P.B.B.Sc Nursing",
        age: "Age limit: 45 years as of May 31 of admission year",
        experience: "At least 1 year professional clinical experience after B.Sc./PBBSc Nursing degree registration",
        admission: "Based on merit of previous qualifying examination"
      },
      admissionTimeline: [
        "Application forms available: April – May",
        "Admission: September"
      ],
      careerPaths: [
        "Lecturer / Professor in Nursing",
        "Nurse Practitioner / Clinical Specialist",
        "Hospital Administrator",
        "Research Scientist in Nursing",
        "International Nursing Careers"
      ],
      link: "https://rvghs.edu.in/programmes/#MSC"
    },

    npcc: {
      name: "Nurse Practitioner in Critical Care (NPCC)",
      duration: "2 Years (Residency)",
      seats: 15,
      type: "Postgraduate Residency",
      tagline: "First postgraduate nursing residency programme in India",
      description: "Initiated by the Indian Nursing Council, this is the first postgraduate nursing residency program in India. Approved by the Government of India and launched by the Health Minister in 2017. RVGHS has been successfully implementing the NPCC program since 2021-22. It is a 2-year residency programme leading to a master's degree, preparing candidates to perform independently in critical care settings.",
      highlights: [
        "Postgraduate residency program",
        "Medical preceptors involved in mentoring, thesis guidance and evaluation",
        "Nurse preceptors support clinical learning",
        "Nursing faculty oversee implementation and conduct classes"
      ],
      eligibility: {
        education: "Registered B.Sc. Nurse",
        experience: "Minimum 1 year clinical experience, preferably in critical care setting",
      },
      curriculum: {
        yearOne: {
          title: "Year I — Core & Advanced Practice Courses",
          courses: [
            "Theoretical Basis for Advanced Practice Nursing",
            "Research Application and Evidence Based Practice in Critical Care",
            "Advanced Skills in Leadership, Management and Teaching",
            "Advanced Pathophysiology applied to Critical Care",
            "Advanced Pharmacology applied to Critical Care",
            "Advanced Health/Physical Assessment"
          ]
        },
        yearTwo: {
          title: "Year II — Specialty Courses",
          courses: [
            "Foundations of Critical Care Nursing Practice",
            "Critical Care Nursing I",
            "Critical Care Nursing II"
          ]
        }
      },
      careerOutcomes: "Graduates are eligible to work in ICUs, emergency departments, and specialized care units in advanced practice roles such as clinical experts, managers, educators and consultants.",
      link: "https://rvghs.edu.in/programmes/#NPCC"
    },

    phd: {
      name: "Ph.D. in Nursing",
      duration: "4 to 6 Years",
      type: "Doctoral",
      tagline: "Advanced research abilities for nursing excellence",
      description: "Established at RVGHS in 2022, the Ph.D. in Nursing programme enables the nursing fraternity to acquire advanced research abilities and prepares nurse educators, administrators, and practitioners to conduct methodical research to raise the standard of nursing care. The programme equips nursing staff to provide patients and clients with evidence-based nursing care.",
      branches: ["Medical and Surgical Nursing", "Paediatric Nursing"],
      eligibility: {
        education: "Master's degree in nursing",
        marks: "Minimum 55% aggregate",
        selection: "Based on entrance examination conducted by RGUHS"
      },
      affiliation: "Rajiv Gandhi University of Health Sciences",
      link: "https://rvghs.edu.in/programmes/#PHD"
    }
  },

  // ─── Departments ─────────────────────────────────────────────
  departments: [
    { name: "Child Health Nursing", contact: "Mrs. Gauthami H. (HOD)", phone: "080-68917114", ext: "114" },
    { name: "Community Health Nursing", contact: "Mr. Chetan Kumar M.R. (HOD)", phone: "080-68917110", ext: "110" },
    { name: "Medical-Surgical Nursing", contact: "Dr. Mamatha N. (HOD)", phone: "080-68917115", ext: "115" },
    { name: "Mental Health Nursing", contact: "Mrs. Meera Chandran (HOD)", phone: "080-68917108", ext: "108" },
    { name: "Obstetrics & Gynaecological Nursing", contact: "Dr. Laishram Dabashini Devi (HOD)", phone: "080-68917107", ext: "107" },
    { name: "Research & Development", contact: "Dr. Laishram Dabashini Devi (HOD)", phone: "080-68917112", ext: "112" }
  ],

  // ─── Placements ──────────────────────────────────────────────
  placements: {
    overview: "RVGHS provides free placement services for all graduated nursing students. Placement activity starts in the final year of nursing, with confirmations targeted in July, August, and September.",
    vision: "Equipping students with relevant professional skills and guiding them towards a bright future and career all around the world with values of Sincerity, Hard Work and Justice.",
    goal: "100% placement support for all students",
    partnerHospitals: [
      "Aster RV Hospital",
      "Fortis Hospital",
      "Manipal Hospital",
      "Narayana Health",
      "Sakra World Hospital",
      "Rainbow Children's Hospital"
    ],
    policies: [
      "Final year students are eligible for campus placements",
      "Students must sign a declaration about post-graduation plans",
      "Students focused on higher education are not eligible for placement drives",
      "One offer policy: once placed, student cannot sit for another campus drive",
      "Pre-placement training is mandatory before campus recruitment"
    ],
    link: "https://rvghs.edu.in/placement_recruitment/"
  },

  // ─── Scholarships ────────────────────────────────────────────
  scholarships: [
    {
      name: "RV Institutional Scholarship",
      description: "Offered by RV Educational Institutions for deserving students"
    },
    {
      name: "Government Scholarships",
      description: "State and central government scholarship schemes for nursing students"
    },
    {
      name: "Merit-Based Scholarships",
      description: "For students with exceptional academic performance"
    },
    {
      name: "Scholarships for Girl Students",
      description: "Special scholarship programmes encouraging women in nursing"
    }
  ],

  // ─── Campus Visit Slots ──────────────────────────────────────
  campusVisitSlots: [
    "10:30 AM",
    "12:00 PM",
    "3:00 PM"
  ],

  // ─── Hostel Details ──────────────────────────────────────────
  hostel: {
    fees: [
      { type: "2 sharing", amount: "₹ 48,300" },
      { type: "3 sharing", amount: "₹ 47,250" },
      { type: "4 sharing", amount: "₹ 46,200" },
      { type: "Dormitory", amount: "₹ 36,750" },
      { type: "Guest Room", amount: "₹ 525/- (Per Day Inclusive of GST)" }
    ],
    cautionDeposit: "₹ 5,000 one time (Refundable after Course Completion or at the time of vacating)",
    messFee: "₹ 52,800 per year (Two instalments of ₹ 26,400 per six months)"
  },

  // ─── About Text ──────────────────────────────────────────────
  about: {
    welcome: "RV Girls High School (RVGHS) was established in the year 2003, and is affiliated to Rajiv Gandhi University of Health Sciences (RGUHS). It is recognised by the Indian Nursing Council and the Karnataka Nursing Council. The college is located in a spacious building and equipped with the latest infrastructure to train students, in Jayanagar 4th Block – which is a minute's walk from the bus terminus, and is easily accessible from every part of the city.",
    whyUs: "With a rich heritage in nursing education, state-of-the-art facilities, dedicated faculty, and a holistic approach to learning, RVGHS offers an unparalleled environment for your professional growth. We not only equip you with the knowledge and skills needed for a successful nursing career but also instil in you the values of empathy, excellence, and service."
  }
};

// ─── Conversation Flow Definitions ─────────────────────────────
const CHAT_FLOWS = {

  // Welcome / Root flow
  welcome: {
    messages: [
      { text: `Hello\nThank you for contacting <strong>RV Girls High School</strong> – <a href="https://www.google.com/maps/search/?api=1&query=RV+College+of+Nursing+Jayanagar+Bengaluru" target="_blank">Jayanagar, Bengaluru</a>.`, delay: 400 },
      { text: `Only <strong>85 seats available</strong> (B.Sc. – 60 | M.Sc. – 25 | NPCC-15).`, delay: 800 },
      { text: `Please reply with:`, delay: 400 }
    ],
    buttons: [
      { label: "🎓 B.Sc. Nursing", action: "bsc_main" },
      { label: "📚 M.Sc. Nursing", action: "msc_main" },
      { label: "🏠 Hostel Details", action: "hostel_details" },
      { label: "💰 Scholarship Details", action: "scholarships" },
      { label: "🏫 Campus Visit Booking", action: "campus_visit" },
      { label: "🩺 Trainings", action: "trainings" },
      { label: "ℹ️ About RVGHS", action: "about" },
      { label: "📞 Contact Us", action: "contact" }
    ]
  },

  // ─── B.Sc. Nursing Flow ──────────────────────────────────────
  bsc_main: {
    messages: [
      { text: `Great choice! 👍`, delay: 300 },
      { text: `<strong>🎓 B.Sc. Nursing — 4 Years</strong>\n\n📝 April - May Application Form\n📍 <a href="https://www.google.com/maps/search/?api=1&query=RV+College+of+Nursing+Jayanagar+Bengaluru" target="_blank">Jayanagar, Bengaluru</a>\n🔍 June - July Selection\n🏛️ Government-Approved Private Institution\n💪 Strong Clinical Exposure\n🪑 <strong>Limited 60 Seats Only</strong>`, delay: 500 },
      { text: `Would you like:`, delay: 300 }
    ],
    buttons: [
      { label: "📈 Career Growth", action: "bsc_career" },
      { label: "📋 Eligibility Criteria", action: "bsc_eligibility" },
      { label: "💰 Fee Structure", action: "fee_enquiry_bsc" },
      { label: "🏥 Placement Details", action: "placement_info" },
      { label: "📞 Talk to Admission Counsellor", action: "talk_to_counsellor" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  bsc_eligibility: {
    messages: [
      { text: `<strong>📋 Eligibility:</strong>\n\n✅ 12th Science (PCB)\n✅ Minimum required percentage as per norms`, delay: 600 },
      { text: `Would you like to book a campus visit? 🏫`, delay: 400 }
    ],
    buttons: [
      { label: "✅ Book Campus Visit", action: "campus_visit" },
      { label: "📈 Career Growth", action: "bsc_career" },
      { label: "💰 Fee Enquiry", action: "fee_enquiry_bsc" },
      { label: "🏥 Placement Info", action: "placement_info" },
      { label: "← Back to B.Sc.", action: "bsc_main" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  bsc_career: {
    messages: [
      { text: `<strong>📈 B.Sc. Nursing — Career Growth</strong>\n\nAfter B.Sc. Nursing:\n• Staff Nurse in Reputed Hospitals\n• Nursing Officer in Government Sectors\n• Military Nursing Services\n• Community Health Nurse\n• Nursing Tutor / Clinical Instructor\n• Opportunities Abroad`, delay: 500 },
      { text: `Would you like to speak with our admission counsellor? 📞`, delay: 400 }
    ],
    buttons: [
      { label: "📞 Talk to Admission Counsellor", action: "talk_to_counsellor" },
      { label: "📋 Eligibility Criteria", action: "bsc_eligibility" },
      { label: "← Back to B.Sc.", action: "bsc_main" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  bsc_timeline: {
    messages: [
      { text: `<strong>📅 B.Sc. Nursing — Admission Timeline</strong>\n\n📝 Application forms available: <strong>April – May</strong>\n🔍 Selection process: <strong>June – July</strong>\n✅ Admissions finalised: <strong>By September</strong>\n\n🔗 <a href="${RVGHS_DATA.college.admissionPortal}" target="_blank">Apply Online Here</a>`, delay: 500 }
    ],
    buttons: [
      { label: "📋 Eligibility", action: "bsc_eligibility" },
      { label: "💰 Fee Enquiry", action: "fee_enquiry_bsc" },
      { label: "← Back to B.Sc.", action: "bsc_main" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  // ─── Fee Enquiry ─────────────────────────────────────────────
  fee_enquiry_bsc: {
    messages: [
      { text: `<strong>💰 Fee Structure</strong>\n\nThank you.\nOur fee structure details will be shared by our admission team for accurate explanation.\n\nPlease share:\n• Student Name\n• 12th Percentage\n• City\n\nOur counsellor will call you within <strong>30 minutes</strong>.`, delay: 500 }
    ],
    form: {
      id: "fee_enquiry",
      fields: [
        { name: "name", label: "Your Full Name", type: "text", placeholder: "Enter your name", required: true },
        { name: "phone", label: "Phone Number", type: "tel", placeholder: "Enter 10-digit number", required: true },
        { name: "email", label: "Email Address", type: "email", placeholder: "Enter your email", required: true },
        { name: "percentage", label: "12th Percentage (%)", type: "number", placeholder: "e.g. 75", required: true },
        { name: "city", label: "City", type: "text", placeholder: "Your city", required: true }
      ],
      submitLabel: "Submit Enquiry 📩",
      successMessage: `Thank you! ✅ Our admissions counsellor will contact you within <strong>30 minutes</strong> with the complete fee structure details.\n\n📞 Meanwhile, you can also call: <strong>${RVGHS_DATA.college.phone.office}</strong>`
    },
    buttons: [
      { label: "← Back to B.Sc.", action: "bsc_main" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  // ─── M.Sc. Nursing Flow ─────────────────────────────────────
  msc_main: {
    messages: [
      { text: `<strong>Advance Your Nursing Career !</strong>`, delay: 300 },
      { text: `<strong>M.Sc. Nursing — 2 Years</strong>\n\n🪑 Only <strong>25 Seats</strong> (5 Seats Each speciality wise)\n📖 Advanced Specializations\n👨‍🏫 Experienced Faculty\n🔬 Clinical Research Exposure`, delay: 500 },
      { text: `Would you like:`, delay: 300 }
    ],
    buttons: [
      { label: "🔬 Specializations Available", action: "msc_specializations" },
      { label: "📋 Eligibility", action: "msc_eligibility" },
      { label: "📈 Career Growth", action: "msc_career" },
      { label: "📞 Book Counselling Session", action: "book_counselling" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  msc_specializations: {
    messages: [
      { text: `<strong>🔬 M.Sc. Nursing — Specializations Available</strong>\n\n1. <strong>Medical Surgical Nursing</strong>\n2. <strong>Child Health Nursing</strong>\n3. <strong>Obstetrics and Gynecological Nursing</strong>\n4. <strong>Community Health Nursing</strong>\n5. <strong>Mental Health Nursing</strong>`, delay: 500 }
    ],
    buttons: [
      { label: "📋 Eligibility", action: "msc_eligibility" },
      { label: "📈 Career Growth", action: "msc_career" },
      { label: "← Back to M.Sc.", action: "msc_main" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  msc_eligibility: {
    messages: [
      { text: `<strong>📋 M.Sc. Nursing — Eligibility</strong>\n\n✅ B.Sc. Nursing with 1-year experience\n✅ Post Basic B.Sc. Nursing`, delay: 600 }
    ],
    buttons: [
      { label: "🔬 Specializations", action: "msc_specializations" },
      { label: "💰 Fee Enquiry", action: "fee_enquiry_msc" },
      { label: "← Back to M.Sc.", action: "msc_main" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  msc_career: {
    messages: [
      { text: `<strong>📈 M.Sc. Nursing — Career Growth</strong>\n\nAfter M.Sc. Nursing:\n1. Lecturer / Professor\n2. Nurse Practitioner\n3. Clinical Specialist\n4. Hospital Administrator\n\nInternational Opportunities`, delay: 500 },
      { text: `🪑 Only <strong>25 seats available</strong> (5 Seats Each speciality wise).\n\nWould you like priority counselling?`, delay: 400 }
    ],
    buttons: [
      { label: "✅ Yes, Book Priority Counselling", action: "book_counselling" },
      { label: "🔬 Specializations", action: "msc_specializations" },
      { label: "📋 Eligibility", action: "msc_eligibility" },
      { label: "← Back to M.Sc.", action: "msc_main" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  fee_enquiry_msc: {
    messages: [
      { text: `<strong>💰 Fee Enquiry — M.Sc. Nursing</strong>\n\nTo receive detailed fee structure information, please share your details. Our counsellor will reach out within <strong>30 minutes</strong>.`, delay: 500 }
    ],
    form: {
      id: "fee_enquiry_msc",
      fields: [
        { name: "name", label: "Your Full Name", type: "text", placeholder: "Enter your name", required: true },
        { name: "phone", label: "Phone Number", type: "tel", placeholder: "Enter 10-digit number", required: true },
        { name: "email", label: "Email Address", type: "email", placeholder: "Enter your email", required: true },
        { name: "specialization", label: "Preferred Specialization", type: "select", options: ["Medical Surgical Nursing", "OBG Nursing", "Paediatric Nursing", "Psychiatric Nursing", "Community Health Nursing"], required: true },
        { name: "city", label: "City", type: "text", placeholder: "Your city", required: true }
      ],
      submitLabel: "Submit Enquiry 📩",
      successMessage: `Thank you! ✅ Our admissions counsellor will contact you within <strong>30 minutes</strong> with the complete M.Sc. Nursing fee structure.\n\n📞 Meanwhile, you can also call: <strong>${RVGHS_DATA.college.phone.office}</strong>`
    },
    buttons: [
      { label: "← Back to M.Sc.", action: "msc_main" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  // ─── Scholarships Flow ──────────────────────────────────────
  scholarships: {
    messages: [
      { text: `<strong>⭐ Clinical Excellence Scholarship</strong>\n\nLimited to <strong>10 Students Only.</strong>\n\n<strong>Criteria:</strong>\n✅ Academic Merit\n✅ Personal Interview\n✅ Early Admission\n\nSeats filling fast.\nWould you like to apply? Reply APPLY.`, delay: 600 }
    ],
    buttons: [
      { label: "📝 Apply Now", action: "scholarship_apply" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  scholarship_apply: {
    messages: [
      { text: `<strong>📝 Scholarship Application Guidance</strong>\n\nPlease share your details and we'll guide you through the scholarship application process.`, delay: 400 }
    ],
    form: {
      id: "scholarship_apply",
      fields: [
        { name: "name", label: "Your Full Name", type: "text", placeholder: "Enter your name", required: true },
        { name: "phone", label: "Phone Number", type: "tel", placeholder: "Enter 10-digit number", required: true },
        { name: "email", label: "Email Address", type: "email", placeholder: "Enter your email", required: true },
        { name: "programme", label: "Interested Programme", type: "select", options: ["B.Sc. Nursing", "M.Sc. Nursing", "NPCC", "Ph.D. Nursing"], required: true }
      ],
      submitLabel: "Get Scholarship Guidance 📩",
      successMessage: `Thank you! ✅ Our scholarship guidance counsellor will reach out to you shortly with eligibility details and application steps.\n\n📞 For immediate assistance, call: <strong>${RVGHS_DATA.college.phone.office}</strong>`
    },
    buttons: [
      { label: "← Back to Scholarships", action: "scholarships" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  // ─── Hostel Flow ───────────────────────────────────────────
  hostel_details: {
    messages: [
      { text: `<strong>🏠 Hostel Details & Fees</strong>\n\n<strong>Annual Hostel Fee:</strong>\n• 2 sharing: <strong>₹ 48,300</strong>\n• 3 sharing: <strong>₹ 47,250</strong>\n• 4 sharing: <strong>₹ 46,200</strong>\n• Dormitory: <strong>₹ 36,750</strong>\n\n<strong>Guest Room:</strong> ₹ 525/- (Per Day Inclusive of GST)`, delay: 600 },
      { text: `<strong>💰 Caution Deposit:</strong>\n₹ 5,000 (One-time, refundable after course completion or at the time of vacating the hostel).`, delay: 400 },
      { text: `<strong>🍽️ Mess Fee:</strong>\n₹ 52,800 per year\n(Payable in two instalments of ₹ 26,400 per six months).`, delay: 500 }
    ],
    buttons: [
      { label: "🏫 Campus Visit Booking", action: "campus_visit" },
      { label: "📞 Talk to Counsellor", action: "talk_to_counsellor" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  // ─── Campus Visit Flow ──────────────────────────────────────
  campus_visit: {
    messages: [
      { text: `<strong>🏫 We would love to welcome you</strong>\n\nAvailable slots:\n\n🕥 10:30 AM\n🕛 12:00 PM\n🕒 3:00 PM\n\nReply with preferred time.\nOur campus is located in <a href="https://www.google.com/maps/search/?api=1&query=RV+College+of+Nursing+Jayanagar+Bengaluru" target="_blank"><strong>Jayanagar, Bengaluru</strong></a> (Easy metro access).`, delay: 500 }
    ],
    buttons: [
      { label: "🕥 10:30 AM", action: "campus_book_1030" },
      { label: "🕛 12:00 PM", action: "campus_book_1200" },
      { label: "🕒 3:00 PM", action: "campus_book_0300" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  campus_book_1030: {
    messages: [
      { text: `Great choice! You selected the <strong>10:30 AM</strong> slot. ⏰\n\nPlease share your details to confirm the visit:`, delay: 400 }
    ],
    form: {
      id: "campus_visit_1030",
      fields: [
        { name: "name", label: "Your Full Name", type: "text", placeholder: "Enter your name", required: true },
        { name: "phone", label: "Phone Number", type: "tel", placeholder: "Enter 10-digit number", required: true },
        { name: "email", label: "Email Address", type: "email", placeholder: "Enter your email", required: true }
      ],
      submitLabel: "Confirm Visit ✅",
      successMessage: `🎉 <strong>Campus visit booked!</strong>\n\n📍 <strong>Location:</strong> ${RVGHS_DATA.college.address}\n⏰ <strong>Time:</strong> 10:30 AM\n\nOur team will call you to confirm the date. See you soon! 🏫\n\n📞 For any changes, call: <strong>${RVGHS_DATA.college.phone.office}</strong>`
    },
    buttons: [
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  campus_book_1200: {
    messages: [
      { text: `Great choice! You selected the <strong>12:00 PM</strong> slot. ⏰\n\nPlease share your details to confirm the visit:`, delay: 400 }
    ],
    form: {
      id: "campus_visit_1200",
      fields: [
        { name: "name", label: "Your Full Name", type: "text", placeholder: "Enter your name", required: true },
        { name: "phone", label: "Phone Number", type: "tel", placeholder: "Enter 10-digit number", required: true },
        { name: "email", label: "Email Address", type: "email", placeholder: "Enter your email", required: true }
      ],
      submitLabel: "Confirm Visit ✅",
      successMessage: `🎉 <strong>Campus visit booked!</strong>\n\n📍 <strong>Location:</strong> ${RVGHS_DATA.college.address}\n⏰ <strong>Time:</strong> 12:00 PM\n\nOur team will call you to confirm the date. See you soon! 🏫\n\n📞 For any changes, call: <strong>${RVGHS_DATA.college.phone.office}</strong>`
    },
    buttons: [
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  campus_book_0300: {
    messages: [
      { text: `Great choice! You selected the <strong>3:00 PM</strong> slot. ⏰\n\nPlease share your details to confirm the visit:`, delay: 400 }
    ],
    form: {
      id: "campus_visit_0300",
      fields: [
        { name: "name", label: "Your Full Name", type: "text", placeholder: "Enter your name", required: true },
        { name: "phone", label: "Phone Number", type: "tel", placeholder: "Enter 10-digit number", required: true },
        { name: "email", label: "Email Address", type: "email", placeholder: "Enter your email", required: true }
      ],
      submitLabel: "Confirm Visit ✅",
      successMessage: `🎉 <strong>Campus visit booked!</strong>\n\n📍 <strong>Location:</strong> ${RVGHS_DATA.college.address}\n⏰ <strong>Time:</strong> 3:00 PM\n\nOur team will call you to confirm the date. See you soon! 🏫\n\n📞 For any changes, call: <strong>${RVGHS_DATA.college.phone.office}</strong>`
    },
    buttons: [
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  // ─── Placement Info ──────────────────────────────────────────
  placement_info: {
    messages: [
      { text: `<strong>🏥 Placement</strong>\n\nOur graduates work in:\n• Corporate hospitals\n• ICU & Emergency departments\n• Government & Private sectors\n• Overseas Hospitals`, delay: 600 },
      { text: `Would you like to speak with our placement coordinator? 📞`, delay: 400 }
    ],
    buttons: [
      { label: "📞 Talk to Placement Coordinator", action: "talk_to_counsellor" },
      { label: "🎓 B.Sc. Nursing", action: "bsc_main" },
      { label: "📚 M.Sc. Nursing", action: "msc_main" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  // ─── Talk to Admission Counsellor ────────────────────────────
  talk_to_counsellor: {
    messages: [
      { text: `<strong>📞 Talk to an Admission Counsellor</strong>\n\nShare your details and our admissions counsellor will call you within <strong>30 minutes</strong>.`, delay: 500 }
    ],
    form: {
      id: "talk_to_counsellor",
      fields: [
        { name: "name", label: "Your Full Name", type: "text", placeholder: "Enter your name", required: true },
        { name: "phone", label: "Phone Number", type: "tel", placeholder: "Enter 10-digit number", required: true },
        { name: "email", label: "Email Address", type: "email", placeholder: "Enter your email", required: true }
      ],
      submitLabel: "Request Callback 📞",
      successMessage: `Thank you! ✅ Our admissions counsellor will call you within <strong>30 minutes</strong>.\n\n📞 Meanwhile, you can also call: <strong>${RVGHS_DATA.college.phone.office}</strong>`
    },
    buttons: [
      { label: "← Back to B.Sc.", action: "bsc_main" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  // ─── Book Counselling Session (M.Sc.) ────────────────────────
  book_counselling: {
    messages: [
      { text: `<strong>📞 Book a Priority Counselling Session</strong>\n\nShare your details to schedule a one-on-one session with our M.Sc. Nursing counsellor.`, delay: 500 }
    ],
    form: {
      id: "book_counselling",
      fields: [
        { name: "name", label: "Your Full Name", type: "text", placeholder: "Enter your name", required: true },
        { name: "phone", label: "Phone Number", type: "tel", placeholder: "Enter 10-digit number", required: true },
        { name: "email", label: "Email Address", type: "email", placeholder: "Enter your email", required: true },
        { name: "specialization", label: "Preferred Specialization", type: "select", options: ["Medical Surgical Nursing", "OBG Nursing", "Paediatric Nursing", "Psychiatric Nursing", "Community Health Nursing"], required: true }
      ],
      submitLabel: "Book Session 📩",
      successMessage: `Thank you! ✅ Our M.Sc. Nursing counsellor will reach out to schedule your priority counselling session.\n\n📞 For immediate assistance, call: <strong>${RVGHS_DATA.college.phone.office}</strong>`
    },
    buttons: [
      { label: "← Back to M.Sc.", action: "msc_main" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  // ─── About RVGHS ──────────────────────────────────────────────
  about: {
    messages: [
      { text: `<strong>ℹ️ About RV Girls High School</strong>\n\n${RVGHS_DATA.about.welcome}\n\n<strong>Why RVGHS?</strong>\n${RVGHS_DATA.about.whyUs}\n\n📅 <strong>Established:</strong> ${RVGHS_DATA.college.established}\n🏛️ <strong>Affiliated to:</strong> ${RVGHS_DATA.college.affiliation}\n✅ <strong>Recognised by:</strong> ${RVGHS_DATA.college.recognitions.join(', ')}\n\n🔗 <a href="${RVGHS_DATA.college.website}" target="_blank">Visit our website</a>`, delay: 700 }
    ],
    buttons: [
      { label: "🎓 B.Sc. Nursing", action: "bsc_main" },
      { label: "📚 M.Sc. Nursing", action: "msc_main" },
      { label: "📞 Contact Us", action: "contact" },
      { label: "🏫 Campus Visit", action: "campus_visit" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  // ─── NPCC ────────────────────────────────────────────────────
  npcc_main: {
    messages: [
      { text: `<strong>🏥 NPCC — Nurse Practitioner in Critical Care</strong>\n\n${RVGHS_DATA.programmes.npcc.description}\n\n⏱️ <strong>Duration:</strong> ${RVGHS_DATA.programmes.npcc.duration}\n🪑 <strong>Seats:</strong> ${RVGHS_DATA.programmes.npcc.seats}\n\n<strong>Programme Highlights:</strong>\n${RVGHS_DATA.programmes.npcc.highlights.map(h => `• ${h}`).join('\n')}\n\n<strong>Career Outcomes:</strong>\n${RVGHS_DATA.programmes.npcc.careerOutcomes}\n\n🔗 <a href="${RVGHS_DATA.programmes.npcc.link}" target="_blank">Learn more</a>`, delay: 700 }
    ],
    buttons: [
      { label: "📋 NPCC Curriculum", action: "npcc_curriculum" },
      { label: "📞 Contact Us", action: "contact" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  npcc_curriculum: {
    messages: [
      { text: `<strong>📋 NPCC — Curriculum Details</strong>\n\n<strong>${RVGHS_DATA.programmes.npcc.curriculum.yearOne.title}</strong>\n${RVGHS_DATA.programmes.npcc.curriculum.yearOne.courses.map(c => `• ${c}`).join('\n')}\n\n<strong>${RVGHS_DATA.programmes.npcc.curriculum.yearTwo.title}</strong>\n${RVGHS_DATA.programmes.npcc.curriculum.yearTwo.courses.map(c => `• ${c}`).join('\n')}`, delay: 600 }
    ],
    buttons: [
      { label: "🏥 NPCC Overview", action: "npcc_main" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  // ─── Ph.D. ───────────────────────────────────────────────────
  phd_main: {
    messages: [
      { text: `<strong>🎓 Ph.D. in Nursing</strong>\n\n${RVGHS_DATA.programmes.phd.description}\n\n⏱️ <strong>Duration:</strong> ${RVGHS_DATA.programmes.phd.duration}\n🏛️ <strong>Affiliated to:</strong> ${RVGHS_DATA.programmes.phd.affiliation}\n\n<strong>Branches Available:</strong>\n${RVGHS_DATA.programmes.phd.branches.map(b => `• ${b}`).join('\n')}\n\n<strong>Eligibility:</strong>\n✅ ${RVGHS_DATA.programmes.phd.eligibility.education} with ${RVGHS_DATA.programmes.phd.eligibility.marks}\n✅ Selection: ${RVGHS_DATA.programmes.phd.eligibility.selection}\n\n🔗 <a href="${RVGHS_DATA.programmes.phd.link}" target="_blank">Learn more</a>`, delay: 700 }
    ],
    buttons: [
      { label: "📞 Contact Us", action: "contact" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  // ─── Trainings ────────────────────────────────────────────────
  trainings: {
    messages: [
      { text: `<strong>🩺 Trainings at RVGHS</strong>\n\n<strong>1. BLS Training</strong>\n(Basic Life Support)\n\n<strong>2. PLS Training</strong>\n(Facility Based New-born Care (FBNBC) & Essential New-born Care (ENBC), IMNCI Module & PLS Module)\n\n<strong>3. SBA Module</strong>\n(Skilled Birth Attendant)\n\n<strong>4. SBE</strong>\n(Simulation Based Education)`, delay: 500 },
      { text: `For more details, talk to our counsellor.`, delay: 300 }
    ],
    buttons: [
      { label: "📞 Talk to Counsellor", action: "talk_to_counsellor" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  // ─── Contact ─────────────────────────────────────────────────
  contact: {
    messages: [
      { text: `<strong>📞 Contact RV Girls High School</strong>\n\n📍 <strong>Address:</strong>\n${RVGHS_DATA.college.address}\n\n📞 <strong>Office:</strong> <a href="tel:${RVGHS_DATA.college.phone.office}">${RVGHS_DATA.college.phone.office}</a>\n📱 <strong>Mobile:</strong> <a href="tel:${RVGHS_DATA.college.phone.mobile1}">${RVGHS_DATA.college.phone.mobile1}</a> / <a href="tel:${RVGHS_DATA.college.phone.mobile2}">${RVGHS_DATA.college.phone.mobile2}</a>\n\n🌐 <strong>Website:</strong> <a href="${RVGHS_DATA.college.website}" target="_blank">rvghs.edu.in</a>\n📝 <strong>Apply Online:</strong> <a href="${RVGHS_DATA.college.admissionPortal}" target="_blank">Admission Portal</a>\n\n🔗 <strong>Social Media:</strong>\n<a href="${RVGHS_DATA.college.social.facebook}" target="_blank">Facebook</a> · <a href="${RVGHS_DATA.college.social.instagram}" target="_blank">Instagram</a> · <a href="${RVGHS_DATA.college.social.youtube}" target="_blank">YouTube</a> · <a href="${RVGHS_DATA.college.social.linkedin}" target="_blank">LinkedIn</a>`, delay: 600 }
    ],
    buttons: [
      { label: "🏢 Department Contacts", action: "dept_contacts" },
      { label: "🏫 Campus Visit", action: "campus_visit" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  },

  dept_contacts: {
    messages: [
      { text: `<strong>🏢 Department Contact Numbers</strong>\n\n${RVGHS_DATA.departments.map(d => `<strong>${d.name}</strong>\n👤 ${d.contact} | 📞 ${d.phone} (Ext: ${d.ext})`).join('\n\n')}`, delay: 600 }
    ],
    buttons: [
      { label: "📞 General Contact", action: "contact" },
      { label: "← Back to Menu", action: "welcome" }
    ]
  }
};

// ─── Intent Matching Keywords ──────────────────────────────────
const INTENT_MAP = [
  { keywords: ["bsc", "b.sc", "bachelor", "undergraduate", "bsc nursing", "b sc"], action: "bsc_main" },
  { keywords: ["msc", "m.sc", "master", "postgraduate", "msc nursing", "m sc", "pg"], action: "msc_main" },
  { keywords: ["npcc", "critical care", "nurse practitioner", "residency", "icu"], action: "npcc_main" },
  { keywords: ["phd", "ph.d", "doctoral", "doctorate", "research"], action: "phd_main" },
  { keywords: ["scholarship", "financial aid", "fee waiver", "funding", "concession"], action: "scholarships" },
  { keywords: ["campus", "visit", "tour", "see college"], action: "campus_visit" },
  { keywords: ["placement", "job", "recruit", "hospital", "career"], action: "placement_info" },
  { keywords: ["contact", "phone", "call", "email", "number", "reach"], action: "contact" },
  { keywords: ["department", "dept", "hod", "faculty"], action: "dept_contacts" },
  { keywords: ["about", "info", "tell me", "college", "rvghs", "history"], action: "about" },
  { keywords: ["eligibility", "criteria", "qualification", "requirement", "qualify"], action: "bsc_eligibility" },
  { keywords: ["fee", "cost", "tuition", "charge", "price", "expense"], action: "fee_enquiry_bsc" },
  { keywords: ["specialization", "branch", "speciality", "stream"], action: "msc_specializations" },
  { keywords: ["admission", "apply", "enroll", "enrol", "register", "application"], action: "bsc_timeline" },
  { keywords: ["hostel", "accommodation", "stay", "room", "mess", "dormitory", "sharing", "guest room"], action: "hostel_details" },
  { keywords: ["hi", "hello", "hey", "hii", "namaste", "good morning", "good evening", "start", "menu", "home"], action: "welcome" },
  { keywords: ["help", "assist", "support", "guide"], action: "welcome" },
  { keywords: ["seat", "seats", "availability", "vacant"], action: "welcome" },
  { keywords: ["address", "location", "where", "map", "direction", "jayanagar"], action: "contact" },
  { keywords: ["counsellor", "counselor", "talk", "callback", "call me"], action: "talk_to_counsellor" },
  { keywords: ["counselling", "counseling", "session", "priority"], action: "book_counselling" },
  { keywords: ["training", "trainings", "bls", "pls", "sba", "sbe", "simulation", "basic life support", "skilled birth", "newborn care"], action: "trainings" }
];
