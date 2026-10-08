/*
enLIGHTen OS v2.7.3 — Google Sheets Line of Work
Changes discussed:
1. Line of Work now stops before the first Milestone row; execution rows are removed from Line of Work.
2. Completed projects are excluded from Design Dashboard and active Line of Work / Execution lists.
3. Execution renamed Execution Dashboard and moved below Fix Meeting.
4. Meetings & MOM renamed Fix Meeting.
5. MOM editing moved into Execution Dashboard.
6. Fix Meeting keeps upcoming + past meeting history and can open/view the MOM of past meetings.
7. Phase 1 backend connection: Projects & Scope of Work read/write through the live Google Apps Script Web App.
*/
const PROJECT_SCOPE_SHEET_ROWS = [
  {
    "serial": 22,
    "project": "140, Sector 26, Rohini",
    "client": "Mr.Bitto Shani",
    "architect": "Nextwall Architects",
    "basement": false,
    "stilt_floor": true,
    "gf": true,
    "1f": true,
    "2f": true,
    "3f": true,
    "terrace": true,
    "facade": true,
    "wall_elevation": true,
    "landscape": false,
    "bath_elevation": true,
    "wardrobe": true,
    "kitchen": true,
    "onboarding": true
  },
  {
    "serial": 23,
    "project": "X-20 Gurgaon",
    "client": "Mr.Ashutosh Garg",
    "architect": "Arteform",
    "basement": false,
    "stilt_floor": true,
    "gf": true,
    "1f": true,
    "2f": true,
    "3f": true,
    "terrace": true,
    "facade": true,
    "wall_elevation": true,
    "landscape": false,
    "bath_elevation": true,
    "wardrobe": true,
    "kitchen": true,
    "onboarding": true
  },
  {
    "serial": 25,
    "project": "903 Camellias",
    "client": "Arteform Designs",
    "architect": "Arteform",
    "basement": false,
    "stilt_floor": false,
    "gf": false,
    "1f": false,
    "2f": false,
    "3f": false,
    "terrace": false,
    "facade": false,
    "wall_elevation": false,
    "landscape": false,
    "bath_elevation": false,
    "wardrobe": false,
    "kitchen": false,
    "onboarding": true
  },
  {
    "serial": 28,
    "project": "64 Sandesh Vihar, Pitampura",
    "client": "Mr.Deepak Mangal",
    "architect": "Nextwall Architects",
    "basement": true,
    "stilt_floor": true,
    "gf": true,
    "1f": true,
    "2f": true,
    "3f": true,
    "terrace": true,
    "facade": true,
    "wall_elevation": true,
    "landscape": false,
    "bath_elevation": true,
    "wardrobe": true,
    "kitchen": true,
    "onboarding": true
  },
  {
    "serial": 30,
    "project": "A-41 Paschim Vihar",
    "client": "Mr.Mohit Aggarwal",
    "architect": "Studio 9491",
    "basement": false,
    "stilt_floor": true,
    "gf": true,
    "1f": false,
    "2f": true,
    "3f": true,
    "terrace": true,
    "facade": true,
    "wall_elevation": true,
    "landscape": false,
    "bath_elevation": true,
    "wardrobe": true,
    "kitchen": true,
    "onboarding": true
  },
  {
    "serial": 31,
    "project": "C-25 Rajauri",
    "client": "Mr.Rishab Kapoor",
    "architect": "Nextwall Architects",
    "basement": false,
    "stilt_floor": true,
    "gf": true,
    "1f": true,
    "2f": false,
    "3f": true,
    "terrace": true,
    "facade": true,
    "wall_elevation": true,
    "landscape": true,
    "bath_elevation": true,
    "wardrobe": true,
    "kitchen": true,
    "onboarding": true
  },
  {
    "serial": 32,
    "project": "Q4 Gurgaon",
    "client": "Mr.Naveen Mittal",
    "architect": "Nextwall Architects",
    "basement": false,
    "stilt_floor": true,
    "gf": true,
    "1f": true,
    "2f": false,
    "3f": false,
    "terrace": true,
    "facade": true,
    "wall_elevation": true,
    "landscape": true,
    "bath_elevation": true,
    "wardrobe": true,
    "kitchen": true,
    "onboarding": true
  },
  {
    "serial": 33,
    "project": "166 Sandesh Vihar",
    "client": "Mr.Rajat Garg",
    "architect": "Nextwall Architects",
    "basement": false,
    "stilt_floor": true,
    "gf": true,
    "1f": true,
    "2f": true,
    "3f": true,
    "terrace": true,
    "facade": true,
    "wall_elevation": true,
    "landscape": false,
    "bath_elevation": true,
    "wardrobe": true,
    "kitchen": true,
    "onboarding": true
  },
  {
    "serial": 34,
    "project": "30/60 Punjabi Bagh, New Delhi, IN\t",
    "client": "Mr.Goldy",
    "architect": "",
    "basement": false,
    "stilt_floor": false,
    "gf": false,
    "1f": false,
    "2f": false,
    "3f": false,
    "terrace": false,
    "facade": false,
    "wall_elevation": false,
    "landscape": false,
    "bath_elevation": false,
    "wardrobe": false,
    "kitchen": false,
    "onboarding": false
  },
  {
    "serial": 35,
    "project": "6, Patel Nagar ",
    "client": "Mr.Gaurav Chauhan",
    "architect": "Afflutus Designs",
    "basement": false,
    "stilt_floor": true,
    "gf": true,
    "1f": true,
    "2f": true,
    "3f": true,
    "terrace": true,
    "facade": true,
    "wall_elevation": true,
    "landscape": true,
    "bath_elevation": true,
    "wardrobe": true,
    "kitchen": true,
    "onboarding": false
  },
  {
    "serial": 36,
    "project": "BJ-120 Shalimar Bagh ",
    "client": "Mrs.Abha Bajaj",
    "architect": "Nextwall Architects",
    "basement": false,
    "stilt_floor": false,
    "gf": false,
    "1f": false,
    "2f": false,
    "3f": false,
    "terrace": false,
    "facade": false,
    "wall_elevation": false,
    "landscape": false,
    "bath_elevation": false,
    "wardrobe": false,
    "kitchen": false,
    "onboarding": false
  },
  {
    "serial": 38,
    "project": "Lchico Residence",
    "client": "Mr.Mohit Roy",
    "architect": "IDF Noida",
    "basement": false,
    "stilt_floor": false,
    "gf": false,
    "1f": false,
    "2f": false,
    "3f": false,
    "terrace": false,
    "facade": false,
    "wall_elevation": false,
    "landscape": false,
    "bath_elevation": false,
    "wardrobe": false,
    "kitchen": false,
    "onboarding": false
  },
  {
    "serial": 39,
    "project": "Jaipur Project",
    "client": "Mr.Veer",
    "architect": "Ar Prateek ",
    "basement": false,
    "stilt_floor": false,
    "gf": false,
    "1f": false,
    "2f": false,
    "3f": false,
    "terrace": false,
    "facade": false,
    "wall_elevation": false,
    "landscape": false,
    "bath_elevation": false,
    "wardrobe": false,
    "kitchen": false,
    "onboarding": false
  },
  {
    "serial": 41,
    "project": "D-273 Ashok Vihar",
    "client": "Rohit Goel",
    "architect": "Nextwall Architects",
    "basement": false,
    "stilt_floor": false,
    "gf": true,
    "1f": true,
    "2f": true,
    "3f": true,
    "terrace": true,
    "facade": true,
    "wall_elevation": true,
    "landscape": true,
    "bath_elevation": true,
    "wardrobe": true,
    "kitchen": true,
    "onboarding": true
  },
  {
    "serial": 42,
    "project": "Lakewood, Faridabad",
    "client": "Mr Karan Ramchandani",
    "architect": "Grandeur Interiors",
    "basement": false,
    "stilt_floor": true,
    "gf": true,
    "1f": true,
    "2f": true,
    "3f": true,
    "terrace": true,
    "facade": true,
    "wall_elevation": true,
    "landscape": false,
    "bath_elevation": true,
    "wardrobe": true,
    "kitchen": false,
    "onboarding": false
  },
  {
    "serial": 43,
    "project": "Hyderabad Residence",
    "client": "Arteform Designs",
    "architect": "Arteform",
    "basement": false,
    "stilt_floor": false,
    "gf": false,
    "1f": false,
    "2f": true,
    "3f": false,
    "terrace": false,
    "facade": false,
    "wall_elevation": false,
    "landscape": false,
    "bath_elevation": false,
    "wardrobe": false,
    "kitchen": false,
    "onboarding": true
  },
  {
    "serial": 44,
    "project": "C2/3 Prashant Vihar",
    "client": "Mr.Deepak Mittal & Gaurav Jain",
    "architect": "Nextwall Architects",
    "basement": true,
    "stilt_floor": true,
    "gf": true,
    "1f": false,
    "2f": false,
    "3f": false,
    "terrace": false,
    "facade": false,
    "wall_elevation": false,
    "landscape": false,
    "bath_elevation": false,
    "wardrobe": false,
    "kitchen": false,
    "onboarding": true
  },
  {
    "serial": 45,
    "project": "D-162, Sec-8, Dwarka, New Delhi \t\t",
    "client": "",
    "architect": "",
    "basement": false,
    "stilt_floor": false,
    "gf": false,
    "1f": false,
    "2f": false,
    "3f": false,
    "terrace": false,
    "facade": false,
    "wall_elevation": false,
    "landscape": false,
    "bath_elevation": false,
    "wardrobe": false,
    "kitchen": false,
    "onboarding": false
  },
  {
    "serial": 46,
    "project": "A-57, Saraswati Vihar, Pitampura Delhi\t\t",
    "client": "Mr.Pitam Goel",
    "architect": "",
    "basement": false,
    "stilt_floor": false,
    "gf": false,
    "1f": false,
    "2f": false,
    "3f": false,
    "terrace": false,
    "facade": false,
    "wall_elevation": false,
    "landscape": false,
    "bath_elevation": false,
    "wardrobe": false,
    "kitchen": false,
    "onboarding": false
  },
  {
    "serial": 47,
    "project": "16, Suvidha Kunj, Pitampura, New Delhi\t\t",
    "client": "Mr.Saket Gupta",
    "architect": "",
    "basement": false,
    "stilt_floor": false,
    "gf": false,
    "1f": false,
    "2f": false,
    "3f": false,
    "terrace": false,
    "facade": false,
    "wall_elevation": false,
    "landscape": false,
    "bath_elevation": false,
    "wardrobe": false,
    "kitchen": false,
    "onboarding": false
  },
  {
    "serial": 48,
    "project": "Gujrawala Town",
    "client": "Mr.Sahil Sharma",
    "architect": "Nextwall Architects",
    "basement": false,
    "stilt_floor": false,
    "gf": true,
    "1f": true,
    "2f": true,
    "3f": false,
    "terrace": true,
    "facade": true,
    "wall_elevation": true,
    "landscape": true,
    "bath_elevation": true,
    "wardrobe": true,
    "kitchen": true,
    "onboarding": false
  },
  {
    "serial": 49,
    "project": "Punjabi Bagh Extension",
    "client": "Mr.Ajay Jain",
    "architect": "Akshay Arora",
    "basement": false,
    "stilt_floor": false,
    "gf": false,
    "1f": false,
    "2f": false,
    "3f": false,
    "terrace": false,
    "facade": false,
    "wall_elevation": false,
    "landscape": false,
    "bath_elevation": false,
    "wardrobe": false,
    "kitchen": false,
    "onboarding": true
  },
  {
    "serial": 50,
    "project": "D4, Ashok Vihar, New Delhi\t\t",
    "client": "Mr.Amit Goel",
    "architect": "Nextwall Architects",
    "basement": false,
    "stilt_floor": false,
    "gf": false,
    "1f": false,
    "2f": false,
    "3f": false,
    "terrace": false,
    "facade": false,
    "wall_elevation": false,
    "landscape": false,
    "bath_elevation": false,
    "wardrobe": false,
    "kitchen": false,
    "onboarding": false
  },
  {
    "serial": 51,
    "project": "D729, Saraswati Vihar, New Delhi\t\t",
    "client": "Mr.Anuj",
    "architect": "",
    "basement": false,
    "stilt_floor": false,
    "gf": false,
    "1f": false,
    "2f": false,
    "3f": false,
    "terrace": false,
    "facade": false,
    "wall_elevation": false,
    "landscape": false,
    "bath_elevation": false,
    "wardrobe": false,
    "kitchen": false,
    "onboarding": false
  },
  {
    "serial": 53,
    "project": "114 Anand Vihar, Pitampura\t\t",
    "client": "Mr.Dixit Bajaj",
    "architect": "",
    "basement": false,
    "stilt_floor": false,
    "gf": false,
    "1f": false,
    "2f": false,
    "3f": false,
    "terrace": false,
    "facade": false,
    "wall_elevation": false,
    "landscape": false,
    "bath_elevation": false,
    "wardrobe": false,
    "kitchen": false,
    "onboarding": false
  },
  {
    "serial": 54,
    "project": "H-3 43 Sector-18, Rohini Delhi 110086",
    "client": "Mr.Rohit Yadav",
    "architect": "",
    "basement": false,
    "stilt_floor": false,
    "gf": false,
    "1f": false,
    "2f": false,
    "3f": false,
    "terrace": false,
    "facade": false,
    "wall_elevation": false,
    "landscape": false,
    "bath_elevation": false,
    "wardrobe": false,
    "kitchen": false,
    "onboarding": false
  },
  {
    "serial": 55,
    "project": "Ghaziabaad",
    "client": "Mr. Chirag",
    "architect": "",
    "basement": false,
    "stilt_floor": false,
    "gf": false,
    "1f": false,
    "2f": false,
    "3f": false,
    "terrace": false,
    "facade": false,
    "wall_elevation": false,
    "landscape": false,
    "bath_elevation": false,
    "wardrobe": false,
    "kitchen": false,
    "onboarding": false
  },
  {
    "serial": 57,
    "project": "121, Dwarkadhish, Sector 26 Rohini Delhi 110085",
    "client": "Mr. Anuj",
    "architect": "",
    "basement": false,
    "stilt_floor": false,
    "gf": false,
    "1f": false,
    "2f": false,
    "3f": false,
    "terrace": false,
    "facade": false,
    "wall_elevation": false,
    "landscape": false,
    "bath_elevation": false,
    "wardrobe": false,
    "kitchen": false,
    "onboarding": false
  },
  {
    "serial": 58,
    "project": "FU148, Pitampura",
    "client": "Mr. Vikash",
    "architect": "",
    "basement": false,
    "stilt_floor": false,
    "gf": false,
    "1f": false,
    "2f": false,
    "3f": false,
    "terrace": false,
    "facade": false,
    "wall_elevation": false,
    "landscape": false,
    "bath_elevation": false,
    "wardrobe": false,
    "kitchen": false,
    "onboarding": false
  },
  {
    "serial": 59,
    "project": "MU8, Pitampura",
    "client": "Mr. Vikash",
    "architect": "",
    "basement": false,
    "stilt_floor": false,
    "gf": false,
    "1f": false,
    "2f": false,
    "3f": false,
    "terrace": false,
    "facade": false,
    "wall_elevation": false,
    "landscape": false,
    "bath_elevation": false,
    "wardrobe": false,
    "kitchen": false,
    "onboarding": false
  }
];

const PROJECT_SCOPE_BOOLEAN_FIELDS = ['Basement', 'Stilt Floor', 'GF', '1F', '2F', '3F', 'Terrace', 'Facade', 'Wall Elevation', 'Landscape', 'Bath Elevation', 'Wardrobe', 'Kitchen', 'Onboarding'];


/*
PROJECT SCOPE — EXACT SOURCE STRUCTURE
Source workbook: Scope of work.xlsx
Columns:
S. No | Current Project | Client | Architect | Basement | Stilt Floor |
GF | 1F | 2F | 3F | Terrace | Facade | Wall Elevation | Landscape |
Bath Elevation | Wardrobe | Kitchen | Onboarding

Boolean scope fields must be displayed as real interactive checkboxes.
The stored data remains boolean true/false; the UI must never show the
raw strings "true" or "false" for these fields.
*/

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Upload, ClipboardCheck, LayoutGrid, Users, Clock, Plus, X, CheckCircle2, Circle, Timer, FileUp, ChevronRight, Settings2, AlertTriangle, Loader2, Building2, CalendarDays, MapPin, LogIn, LogOut, Navigation, FileText, HardHat, ChevronDown
} from "lucide-react";

/* ---------------------------------------------------------------
   TOKENS
   Blueprint drafting theme: deep navy title-block sidebar, warm
   drafting-paper canvas, cyan linework, amber = pending, green = done,
   redline = overdue (architectural "redlines" mark issues on drawings).
--------------------------------------------------------------- */
const T = {
  navy: "#0B1B33",
  navy2: "#122A4D",
  blue: "#1D4E89",
  cyan: "#8FD6E8",
  paper: "#F6F3EA",
  paperDim: "#EDE8DA",
  ink: "#16202C",
  inkDim: "#5B6472",
  amber: "#C97A1F",
  amberBg: "#FBEBD6",
  green: "#3F8A63",
  greenBg: "#E4F0E9",
  redline: "#B34328",
  redlineBg: "#F8E6DF",
  line: "#D8D0BC",
};


// Project Scope checkbox helper: boolean values remain true/false in state,
// but are always rendered as an interactive checkbox in the UI.
const ScopeCheckbox = ({ checked, onChange, label }) => (
  <label style={{
    display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer",
    userSelect: "none"
  }}>
    <input
      type="checkbox"
      checked={Boolean(checked)}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={label}
      style={{ width: 18, height: 18, cursor: "pointer" }}
    />
    <span>{Boolean(checked) ? "Yes" : "No"}</span>
  </label>
);

const FONT_DISPLAY = "'Space Grotesk', 'Arial Narrow', sans-serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', 'Courier New', monospace";

/* ---------------------------------------------------------------
   SEED DATA — pulled directly from the "Floor | Zone" tab of the
   Received Sheet 2026. Projects run across the top of that sheet;
   each row below is a zone letter (A, B, C...), and each cell holds
   "letter | floor | room name" for that project. Three projects
   (H-3 Rohini, F1U8, Royal Enfield x2) don't have zones filled in
   yet on the sheet, so they show up here with an empty zone map.
--------------------------------------------------------------- */
const SEED_PROJECTS = [
  {
    "id": "p021",
    "no": "021",
    "name": "C-28 Shubham Enclave",
    "address": "C-28 Shubham Enclave, New Delhi, IN",
    "type": "Residence",
    "startDate": "07.08.2022",
    "contacts": {
      "Site Incharge": {
        "name": "Manoj Dalmia",
        "mobile": "9811520508"
      },
      "Accounts Incharge": {
        "name": "Manoj Dalmia",
        "mobile": "9811520508"
      },
      "Architect": {
        "name": "Piyush Mittal",
        "mobile": "9711500133"
      },
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": "9999277482"
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": "8745002789"
      },
      "Process Coordinator": {
        "name": "Rajesh Kapoor",
        "mobile": "9312992402"
      },
      "Site Supervisor": {
        "name": "Rohit",
        "mobile": "7053587240"
      },
      "Electrical Contractor": {
        "name": "Subhash",
        "mobile": "9810034240"
      },
      "POP Contractor": {
        "name": "Chander",
        "mobile": "9315152288"
      },
      "Lighting Supplier": {
        "name": "The Light Haus / ALS / Retina",
        "mobile": "9810153315 / 8801118888"
      },
      "Automation": {
        "name": "No",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "p022",
    "no": "022",
    "name": "140, Rohini",
    "address": "140, Rohini, New Delhi, IN",
    "type": "Residence",
    "startDate": "23.08.2022",
    "contacts": {
      "Site Incharge": {
        "name": "Trinetra Property",
        "mobile": "9873099366"
      },
      "Accounts Incharge": {
        "name": "Himank Trinetra",
        "mobile": "91 9971461052"
      },
      "Architect": {
        "name": "Piyush Mittal",
        "mobile": "9711500133"
      },
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": "9999277482"
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": "8745002789"
      },
      "Site Supervisor": {
        "name": "Santosh Kumar",
        "mobile": "9971916200"
      },
      "Electrical Contractor": {
        "name": "Subhash",
        "mobile": "9810034240"
      },
      "POP Contractor": {
        "name": "Sanjay",
        "mobile": "8851724667"
      },
      "Furniture Contractor": {
        "name": "SK Surama",
        "mobile": "9810130472"
      },
      "Lighting Supplier": {
        "name": "The Light Haus / Ashish Gupta",
        "mobile": "9810153315 / 9654507988"
      }
    },
    "zones": {}
  },
  {
    "id": "p023",
    "no": "023",
    "name": "X-20, Gurugram",
    "address": "X-20, Gurugram, Haryana",
    "type": "Residence",
    "startDate": "16.01.2023",
    "contacts": {
      "Site Incharge": {
        "name": "Ashutosh Garg",
        "mobile": "9810102414"
      },
      "Architect": {
        "name": "Shaili Gupta",
        "mobile": "9711186738"
      },
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": "9999277482"
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": "8745002789"
      },
      "Site Supervisor": {
        "name": "Ravi Gupta",
        "mobile": "9559609500"
      },
      "Lighting Supplier": {
        "name": "Viraj",
        "mobile": "9811621680"
      },
      "Automation": {
        "name": "Nayak Automation",
        "mobile": "8882888687"
      }
    },
    "zones": {}
  },
  {
    "id": "p025",
    "no": "025",
    "name": "903, DLF Camellias",
    "address": "903, DLF Camellias, Gurugram, Haryana",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Architect": {
        "name": "Shaili Gupta",
        "mobile": "9711186738"
      },
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": "9999277482"
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": "8745002789"
      },
      "Automation": {
        "name": "Nayak Automation",
        "mobile": "8882888687"
      }
    },
    "zones": {}
  },
  {
    "id": "p026",
    "no": "026",
    "name": "Ramjas Road (Soni's)",
    "address": "12, Ramjas Road, Karol Bagh, New Delhi, IN | Soni's",
    "type": "Residence",
    "startDate": "17.03.2023",
    "contacts": {
      "Site Incharge": {
        "name": "Ram Soni",
        "mobile": "9899556666"
      },
      "Architect": {
        "name": "Piyush Mittal",
        "mobile": "9711500133"
      },
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": "9999277482"
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": "8745002789"
      },
      "Site Supervisor": {
        "name": "Paramjeet (PMC)",
        "mobile": "9811373799"
      }
    },
    "zones": {}
  },
  {
    "id": "p027",
    "no": "027",
    "name": "Ramjas Road (Gupta's)",
    "address": "12, Ramjas Road, Karol Bagh, New Delhi, IN | Gupta's",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Architect": {
        "name": "Piyush Mittal",
        "mobile": ""
      },
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "p028",
    "no": "028",
    "name": "64, Sandesh Vihar",
    "address": "64, Sandesh Vihar, Pitampura, New Delhi, IN",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Architect": {
        "name": "Piyush Mittal",
        "mobile": ""
      },
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "p030",
    "no": "030",
    "name": "A2/41, Paschim Vihar",
    "address": "A2/41, Paschim Vihar, New Delhi, IN",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "p031",
    "no": "031",
    "name": "C-25, Rajouri Garden",
    "address": "C-25, Rajouri Garden, New Delhi, IN",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Architect": {
        "name": "Piyush Mittal",
        "mobile": ""
      },
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "p032",
    "no": "032",
    "name": "Q4, DLF Phase III",
    "address": "Q4 DLF Phase III, Gurugram, Haryana",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Architect": {
        "name": "Piyush Mittal",
        "mobile": ""
      },
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "p033",
    "no": "033",
    "name": "166, Sandesh Vihar",
    "address": "166, Sandesh Vihar, Pitampura, New Delhi, IN",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Architect": {
        "name": "Piyush Mittal",
        "mobile": ""
      },
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "p034",
    "no": "034",
    "name": "30/60 Punjabi Bagh",
    "address": "30/60 Punjabi Bagh, New Delhi, IN",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Architect": {
        "name": "Piyush Mittal",
        "mobile": ""
      },
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "p035",
    "no": "035",
    "name": "6, Patel Nagar",
    "address": "6, Patel Nagar, New Delhi, IN",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "p036",
    "no": "036",
    "name": "BJ-120 Shalimar Bagh",
    "address": "BJ-120 Shalimar Bagh, New Delhi, IN",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Architect": {
        "name": "Piyush Mittal",
        "mobile": ""
      },
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "p038",
    "no": "038",
    "name": "Lchico Residence",
    "address": "Lchico Residence, Prayagraj",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "p039",
    "no": "039",
    "name": "Jaipur",
    "address": "Jaipur, Rajasthan",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "p041",
    "no": "041",
    "name": "D-273 Ashok Vihar",
    "address": "D-273 Ashok Vihar, New Delhi, IN",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Architect": {
        "name": "Piyush Mittal",
        "mobile": ""
      },
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "lakewood",
    "no": "042",
    "name": "Lakewood, Faridabad, Haryana, IN",
    "address": "Lakewood, Faridabad, Haryana, IN",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {
      "A": {
        "floor": "GF",
        "room": "Entrance Lobby"
      },
      "B": {
        "floor": "GF",
        "room": "Lift Lobby"
      },
      "C": {
        "floor": "GF",
        "room": "Lobby + Cigar Lounge"
      },
      "D": {
        "floor": "GF",
        "room": "Bar + Dinning Area"
      },
      "E": {
        "floor": "GF",
        "room": "Passage"
      },
      "F": {
        "floor": "GF",
        "room": "Day Room"
      },
      "G": {
        "floor": "GF",
        "room": "Powder RM"
      },
      "H": {
        "floor": "GF",
        "room": "Kitchen"
      },
      "I": {
        "floor": "GF",
        "room": "Washing Area"
      },
      "J": {
        "floor": "GF",
        "room": "Balcony"
      },
      "K": {
        "floor": "GF",
        "room": "Front Courtyard"
      },
      "L": {
        "floor": "GF",
        "room": "Veranda"
      },
      "M": {
        "floor": "GF",
        "room": "Server Room"
      },
      "N": {
        "floor": "GF",
        "room": "Staircase"
      },
      "O": {
        "floor": "1F",
        "room": "Lift Lobby"
      },
      "P": {
        "floor": "1F",
        "room": "Passage"
      },
      "Q": {
        "floor": "1F",
        "room": "Family Lounge"
      },
      "R": {
        "floor": "1F",
        "room": "Master Lounge"
      },
      "S": {
        "floor": "1F",
        "room": "Balcony"
      },
      "T": {
        "floor": "1F",
        "room": "Master Vestibule"
      },
      "U": {
        "floor": "1F",
        "room": "Master Bedroom"
      },
      "V": {
        "floor": "1F",
        "room": "Toilet & Bathroom"
      },
      "W": {
        "floor": "1F",
        "room": "Dresser"
      },
      "X": {
        "floor": "1F",
        "room": "Dresser"
      },
      "Y": {
        "floor": "1F",
        "room": "Kid'd Room"
      },
      "Z": {
        "floor": "1F",
        "room": "Kid'd Toilet"
      },
      "AA": {
        "floor": "1F",
        "room": "Guest Bedroom"
      },
      "AB": {
        "floor": "1F",
        "room": "Bathroom & Toilet"
      },
      "AC": {
        "floor": "2F",
        "room": "Master Lounge"
      },
      "AD": {
        "floor": "2F",
        "room": "Master Vestibule"
      },
      "AE": {
        "floor": "2F",
        "room": "Master Bedroom"
      },
      "AF": {
        "floor": "2F",
        "room": "Master Toilet"
      },
      "AG": {
        "floor": "2F",
        "room": "Master Dresser"
      },
      "AH": {
        "floor": "2F",
        "room": "Mandir"
      },
      "AI": {
        "floor": "2F",
        "room": "Balcony"
      },
      "AJ": {
        "floor": "2F",
        "room": "Tarana's Room"
      },
      "AK": {
        "floor": "2F",
        "room": "Bathroom & Toilet"
      },
      "AL": {
        "floor": "2F",
        "room": "Guest Bedroom"
      },
      "AM": {
        "floor": "2F",
        "room": "Bathroom & Toilet"
      },
      "AN": {
        "floor": "2F",
        "room": "Staff Room"
      },
      "AO": {
        "floor": "2F",
        "room": "Toilet"
      },
      "AP": {
        "floor": "2F",
        "room": "Staircase"
      },
      "AQ": {
        "floor": "Facade",
        "room": ""
      },
      "AR": {
        "floor": "Terrace",
        "room": ""
      },
      "AS": {
        "floor": "Terrace",
        "room": "Gym"
      },
      "AT": {
        "floor": "Terrace",
        "room": "Powder Toilet"
      },
      "AU": {
        "floor": "Terrace",
        "room": "Jacuzzi"
      },
      "AV": {
        "floor": "Terrace",
        "room": "Lift Lobby"
      }
    }
  },
  {
    "id": "cmhouse",
    "no": "043",
    "name": "CM House, Hyderabad",
    "address": "Hyderabad, Telangana, IN",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {
      "A": {
        "floor": "GF",
        "room": "Reception"
      },
      "B": {
        "floor": "GF",
        "room": "Lobby"
      },
      "C": {
        "floor": "GF",
        "room": "Managing Director"
      },
      "D": {
        "floor": "GF",
        "room": "Staircase"
      },
      "E": {
        "floor": "GF",
        "room": "Mother's Bedroom"
      },
      "F": {
        "floor": "GF",
        "room": "Toilet"
      },
      "G": {
        "floor": "GF",
        "room": "Kitchen"
      },
      "H": {
        "floor": "GF",
        "room": "Dry Kitchen"
      },
      "I": {
        "floor": "GF",
        "room": "Lounge Dinning"
      },
      "J": {
        "floor": "GF",
        "room": "Pantry"
      },
      "K": {
        "floor": "GF",
        "room": "Living Room"
      },
      "L": {
        "floor": "GF",
        "room": "PDR Toilet"
      },
      "M": {
        "floor": "GF",
        "room": "Verandah"
      },
      "N": {
        "floor": "GF",
        "room": "Meeting Room"
      },
      "O": {
        "floor": "GF",
        "room": "Office PDR Toilet"
      },
      "P": {
        "floor": "1F",
        "room": "Parent's Bedroom"
      },
      "Q": {
        "floor": "1F",
        "room": "Master Bed Toilet"
      },
      "R": {
        "floor": "1F",
        "room": "Closet"
      },
      "S": {
        "floor": "1F",
        "room": "Staircase"
      },
      "T": {
        "floor": "1F",
        "room": "Son's Bedroom"
      },
      "U": {
        "floor": "1F",
        "room": "Son's Toilet"
      },
      "V": {
        "floor": "1F",
        "room": "Closet"
      },
      "W": {
        "floor": "1F",
        "room": "Lounge"
      },
      "X": {
        "floor": "1F",
        "room": "Bar & Lounge Sitting"
      },
      "Y": {
        "floor": "1F",
        "room": "Guest Bedroom"
      },
      "Z": {
        "floor": "1F",
        "room": "Toilet"
      },
      "AA": {
        "floor": "1F",
        "room": "Home Theater"
      },
      "AB": {
        "floor": "1F",
        "room": "Deck"
      },
      "AC": {
        "floor": "1F",
        "room": "Puja"
      },
      "AD": {
        "floor": "Facade",
        "room": "Front Elevation"
      },
      "AE": {
        "floor": "1F",
        "room": "Powder Toilet"
      },
      "AF": {
        "floor": "Terrace",
        "room": ""
      },
      "AG": {
        "floor": "Terrace",
        "room": "Gym"
      },
      "AH": {
        "floor": "Terrace",
        "room": "Spa"
      },
      "AJ": {
        "floor": "Terrace",
        "room": "Utility"
      }
    }
  },
  {
    "id": "p044",
    "no": "044",
    "name": "C3/2, Prashant Vihar",
    "address": "C3/2 Prashant Vihar, Rohini, New Delhi, IN",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Architect": {
        "name": "Piyush Mittal",
        "mobile": ""
      },
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "p045",
    "no": "045",
    "name": "D-162, Sec-8 Dwarka",
    "address": "D-162, Sec-8, Dwarka, New Delhi",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Architect": {
        "name": "Piyush Mittal",
        "mobile": ""
      },
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "a57",
    "no": "046",
    "name": "A-57, Saraswati Vihar",
    "address": "A-57, Saraswati Vihar, Pitampura, Delhi",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Architect": {
        "name": "Piyush Mittal",
        "mobile": ""
      },
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {
      "A": {
        "floor": "GF",
        "room": "Lounge"
      },
      "B": {
        "floor": "GF",
        "room": "Office Area"
      },
      "C": {
        "floor": "GF",
        "room": "Toilet"
      },
      "D": {
        "floor": "GF",
        "room": "Staircase"
      },
      "E": {
        "floor": "1F",
        "room": "Drawing Room"
      },
      "F": {
        "floor": "1F",
        "room": "Show Kitchen"
      },
      "G": {
        "floor": "1F",
        "room": "Pooja"
      },
      "H": {
        "floor": "1F",
        "room": "Balcony"
      },
      "I": {
        "floor": "1F",
        "room": "Drawing Room"
      },
      "J": {
        "floor": "1F",
        "room": "Garden"
      },
      "K": {
        "floor": "1F",
        "room": "Toilet"
      },
      "L": {
        "floor": "1F",
        "room": "Staircase"
      },
      "M": {
        "floor": "2F",
        "room": "Double height Above"
      },
      "N": {
        "floor": "2F",
        "room": "Son's Bedroom"
      },
      "O": {
        "floor": "2F",
        "room": "Son's Toilet"
      },
      "P": {
        "floor": "2F",
        "room": "Guest Bedroom"
      },
      "Q": {
        "floor": "2F",
        "room": "Guest toilet"
      },
      "R": {
        "floor": "2F",
        "room": "Lockable Store"
      },
      "S": {
        "floor": "2F",
        "room": "Master Bedroom"
      },
      "T": {
        "floor": "2F",
        "room": "Master Toilet"
      },
      "U": {
        "floor": "2F",
        "room": "Balcony"
      },
      "V": {
        "floor": "Terrace",
        "room": "Passage & Lobby"
      },
      "W": {
        "floor": "Terrace",
        "room": "PDR"
      },
      "X": {
        "floor": "Terrace",
        "room": "Open Terrece"
      },
      "Y": {
        "floor": "Terrace",
        "room": "Pentry"
      },
      "Z": {
        "floor": "Terrace",
        "room": "Home Theatar"
      },
      "AA": {
        "floor": "SF",
        "room": "Paved Green"
      },
      "AB": {
        "floor": "SF",
        "room": "Stilt Parking"
      },
      "AC": {
        "floor": "SF",
        "room": "Staircase & Lobby"
      },
      "AD": {
        "floor": "SF",
        "room": "Store Room"
      },
      "AE": {
        "floor": "SF",
        "room": "Servent Room"
      },
      "AF": {
        "floor": "SF",
        "room": "Servent Toilet"
      }
    }
  },
  {
    "id": "p047",
    "no": "047",
    "name": "16, Suvidha Kunj",
    "address": "16, Suvidha Kunj, Pitampura, New Delhi",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Architect": {
        "name": "Piyush Mittal",
        "mobile": ""
      },
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "p048",
    "no": "048",
    "name": "A-30, Gujranwala Town",
    "address": "A-30, Gujranwala Town, New Delhi",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Architect": {
        "name": "Piyush Mittal",
        "mobile": ""
      },
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "p049",
    "no": "049",
    "name": "Club Road",
    "address": "Club Road, Punjabi Bagh, New Delhi",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "p050",
    "no": "050",
    "name": "D4, Ashok Vihar",
    "address": "D4, Ashok Vihar, New Delhi",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Architect": {
        "name": "Piyush Mittal",
        "mobile": ""
      },
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "p051",
    "no": "051",
    "name": "D729, Saraswati Vihar",
    "address": "D729, Saraswati Vihar, New Delhi",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Architect": {
        "name": "Piyush Mittal",
        "mobile": ""
      },
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "p053",
    "no": "053",
    "name": "114 Anand Vihar",
    "address": "114 Anand Vihar, Pitampura",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Architect": {
        "name": "Piyush Mittal",
        "mobile": ""
      },
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "h3rohini",
    "no": "054",
    "name": "H-3 43 Sector-18, Rohini Delhi 110086",
    "address": "H-3 43 Sector-18, Rohini, Delhi 110086",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "p055",
    "no": "055",
    "name": "Ghaziabad",
    "address": "Ghaziabad",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "p057",
    "no": "057",
    "name": "121, Dwarkadhish",
    "address": "121, Dwarkadhish, Sector 26, Rohini, Delhi 110085",
    "type": "Residence",
    "startDate": "",
    "contacts": {
      "Architect": {
        "name": "Piyush Mittal",
        "mobile": ""
      },
      "Principal Lighting Designer": {
        "name": "Shivum Gupta",
        "mobile": ""
      },
      "Lighting Engineer": {
        "name": "Pradeep Chauhan",
        "mobile": ""
      }
    },
    "zones": {}
  },
  {
    "id": "punjabibagh",
    "no": "\u2014",
    "name": "11/26 Punjabi Bagh, Delhi",
    "address": "11/26 Punjabi Bagh, Delhi",
    "type": "Residence",
    "startDate": "",
    "contacts": {},
    "zones": {
      "A": {
        "floor": "GF",
        "room": "Lobby"
      },
      "B": {
        "floor": "GF",
        "room": "Family Lounge"
      },
      "C": {
        "floor": "GF",
        "room": "Powder RM"
      },
      "D": {
        "floor": "GF",
        "room": "Daughter's Bedroom -2"
      },
      "E": {
        "floor": "GF",
        "room": "Daughter's Bathroom -2"
      },
      "F": {
        "floor": "GF",
        "room": "Kitchen"
      },
      "G": {
        "floor": "GF",
        "room": "Utility"
      },
      "H": {
        "floor": "GF",
        "room": "Daughter's Bedroom -1"
      },
      "I": {
        "floor": "GF",
        "room": "Daughter's Bathroom -1"
      },
      "J": {
        "floor": "GF",
        "room": "Sisterinlaw's Bedroom"
      },
      "K": {
        "floor": "GF",
        "room": "Sisterinlaw's Dresser"
      },
      "L": {
        "floor": "GF",
        "room": "Sisterinlaw's Bathroom"
      },
      "M": {
        "floor": "GF",
        "room": "Dinning & Drawing"
      },
      "N": {
        "floor": "GF",
        "room": "Balcony"
      },
      "O": {
        "floor": "GF",
        "room": "Front Balcony"
      },
      "P": {
        "floor": "GF",
        "room": "Back Balcony"
      },
      "Q": {
        "floor": "GF",
        "room": "Staircase"
      },
      "R": {
        "floor": "1F",
        "room": "Lobby & Family Lounge"
      },
      "S": {
        "floor": "1F",
        "room": "Drawing Room"
      },
      "T": {
        "floor": "1F",
        "room": "Bedroom -02"
      },
      "U": {
        "floor": "1F",
        "room": "Washroom"
      },
      "V": {
        "floor": "1F",
        "room": "Temple"
      },
      "W": {
        "floor": "1F",
        "room": "Kitchen"
      },
      "X": {
        "floor": "1F",
        "room": "Utility"
      },
      "Y": {
        "floor": "1F",
        "room": "Bedroom -01"
      },
      "Z": {
        "floor": "1F",
        "room": "Dress & Toilet"
      },
      "AA": {
        "floor": "1F",
        "room": "Powder Toilet"
      },
      "AB": {
        "floor": "1F",
        "room": "Master Bedroom"
      },
      "AC": {
        "floor": "1F",
        "room": "Dresser & Bathroom"
      },
      "AD": {
        "floor": "1F",
        "room": "Back Balcony"
      },
      "AE": {
        "floor": "1F",
        "room": "Front Balcony"
      }
    }
  },
  {
    "id": "conservatory",
    "no": "\u2014",
    "name": "Conservatory [Farmhouse], Gurugram",
    "address": "Conservatory [Farmhouse], Gurugram",
    "type": "Residence",
    "startDate": "",
    "contacts": {},
    "zones": {
      "A": {
        "floor": "GF",
        "room": "Master Bedroom"
      },
      "B": {
        "floor": "GF",
        "room": "Restroom"
      },
      "C": {
        "floor": "GF",
        "room": "Outdoor"
      },
      "D": {
        "floor": "Terrace",
        "room": "Terrace"
      }
    }
  },
  {
    "id": "f1u8",
    "no": "\u2014",
    "name": "F1U8, Pitampura",
    "address": "F1U8, Pitampura",
    "type": "Residence",
    "startDate": "",
    "contacts": {},
    "zones": {}
  },
  {
    "id": "md24",
    "no": "\u2014",
    "name": "MD24 Pitampura",
    "address": "MD24 Pitampura",
    "type": "Residence",
    "startDate": "",
    "contacts": {},
    "zones": {
      "A": {
        "floor": "GF",
        "room": "Lobby"
      },
      "B": {
        "floor": "GF",
        "room": "Living Room"
      },
      "C": {
        "floor": "GF",
        "room": "Guest Bedroom"
      },
      "D": {
        "floor": "GF",
        "room": "Toilet"
      },
      "E": {
        "floor": "GF",
        "room": "Kitchen"
      },
      "F": {
        "floor": "GF",
        "room": "Parent's Bedroom"
      },
      "G": {
        "floor": "GF",
        "room": "Toilet"
      },
      "H": {
        "floor": "GF",
        "room": "PDR Toilet"
      },
      "I": {
        "floor": "1F",
        "room": "Passage Area"
      },
      "J": {
        "floor": "1F",
        "room": "Entertaiinment area"
      },
      "K": {
        "floor": "1F",
        "room": "Front Bedroom"
      },
      "L": {
        "floor": "1F",
        "room": "Front Dresser"
      },
      "M": {
        "floor": "1F",
        "room": "Front Wasroom"
      },
      "N": {
        "floor": "1F",
        "room": "Master Bedroom"
      },
      "O": {
        "floor": "1F",
        "room": "Master Dresser"
      },
      "P": {
        "floor": "1F",
        "room": "Master Wasroom"
      },
      "Q": {
        "floor": "2F",
        "room": "Passage Area"
      },
      "R": {
        "floor": "2F",
        "room": "Living Room"
      },
      "S": {
        "floor": "2F",
        "room": "Front Bedroom"
      },
      "T": {
        "floor": "2F",
        "room": "Front Dresser & Wasroom"
      },
      "U": {
        "floor": "2F",
        "room": "Kitchen"
      },
      "V": {
        "floor": "2F",
        "room": "Parent's Bedroom"
      },
      "W": {
        "floor": "2F",
        "room": "Parent's Wasroom"
      },
      "X": {
        "floor": "2F",
        "room": "PDR Toilet"
      },
      "Y": {
        "floor": "Facade",
        "room": "Front Elevation"
      },
      "Z": {
        "floor": "3F",
        "room": "Passage Area"
      },
      "AA": {
        "floor": "3F",
        "room": "Guest Bedroom"
      },
      "AB": {
        "floor": "3F",
        "room": "Kids Room"
      },
      "AC": {
        "floor": "3F",
        "room": "Kids Dresser"
      },
      "AD": {
        "floor": "3F",
        "room": "Kids Wasroom"
      },
      "AE": {
        "floor": "3F",
        "room": "Master Bedroom"
      },
      "AF": {
        "floor": "3F",
        "room": "Master Dresser"
      },
      "AG": {
        "floor": "3F",
        "room": "Master Wasroom"
      },
      "AH": {
        "floor": "Stilt",
        "room": "Car Parking"
      },
      "AI": {
        "floor": "Stilt",
        "room": "Lounge"
      },
      "AJ": {
        "floor": "Stilt",
        "room": "Closet"
      },
      "AK": {
        "floor": "Stilt",
        "room": "Staff Room & Toilet"
      },
      "AL": {
        "floor": "Stilt",
        "room": "PDR Toilet"
      },
      "AM": {
        "floor": "Terrace",
        "room": "Pergola & Terrace"
      },
      "AN": {
        "floor": "Terrace",
        "room": "Lounge Area"
      },
      "AO": {
        "floor": "Terrace",
        "room": "PDR Toilet"
      },
      "AP": {
        "floor": "Terrace",
        "room": "Staircase"
      }
    }
  },
  {
    "id": "regurgaon",
    "no": "\u2014",
    "name": "Royal Enfeild, Gurgaon",
    "address": "Royal Enfeild, Gurgaon",
    "type": "Residence",
    "startDate": "",
    "contacts": {},
    "zones": {}
  },
  {
    "id": "rechennai",
    "no": "\u2014",
    "name": "Royal Enfield, Chennai",
    "address": "Royal Enfield, Chennai",
    "type": "Residence",
    "startDate": "",
    "contacts": {},
    "zones": {}
  }
].map((p) => ({ ...p, status: p.status || "Ongoing" }));

// The floor levels that appear anywhere in the zone data — used to
// group zone letters by floor when picking them in Classify, and as
// the fallback set if a project has no zones defined yet.
const FLOOR_ORDER = ["Stilt", "SF", "GF", "1F", "2F", "3F", "4F", "Facade", "Terrace"];

function sortedZoneLetters(project) {
  return Object.keys(project.zones || {}).sort((a, b) => a.length - b.length || a.localeCompare(b));
}

// Every zone letter that appears across all projects, in sheet order
// (A, B, C ... Z, AA, AB ...) — used as the row list for the matrix.
function allZoneLetters(projects) {
  const set = new Set();
  projects.forEach((p) => Object.keys(p.zones || {}).forEach((z) => set.add(z)));
  return Array.from(set).sort((a, b) => a.length - b.length || a.localeCompare(b));
}

// The roles captured on the "Profile" onboarding sheet, grouped exactly
// as the sheet groups them — under Owner, Design, and Construction.
const ROLE_CATEGORIES = [
  { category: "Owner", roles: ["Owner", "Site Incharge", "Accounts Incharge"] },
  { category: "Design", roles: ["Architect", "Principal Lighting Designer", "Lighting Designer", "Lighting Engineer", "Process Coordinator"] },
  { category: "Construction", roles: ["Site Supervisor", "Electrical Contractor", "POP Contractor", "Stone Contractor", "Furniture Contractor", "Lighting Supplier", "Automation"] },
];
const ROLES = ROLE_CATEGORIES.flatMap((c) => c.roles);
const TEAM_DEPARTMENTS = ["Design", "Execution", "Project Management", "Accounts", "Admin", "Management"];
const TEAM_DESIGNATIONS = [
  "Principal Lighting Designer", "Lighting Designer", "Lighting Engineer", "Process Coordinator",
  "Project Manager", "Site Supervisor", "Architect", "Accounts", "Admin", "Management"
];
const categoryOf = (role) => ROLE_CATEGORIES.find((c) => c.roles.includes(role))?.category || "Other";
const categoryColor = (cat) => cat === "Owner" ? T.redline : cat === "Design" ? T.blue : cat === "Construction" ? T.green : T.inkDim;

function blankContacts() {
  return {};
}

// Stable key for a contact — used to attach a rating that survives even
// though the directory itself is rebuilt fresh from project data each time.
function contactKey(name, mobile) {
  return ((name || "").trim() + "|" + (mobile || "").trim()).toLowerCase();
}

// Builds the vendor/contractor/designer directory by de-duplicating every
// named contact across every project's profile (matched on name + mobile),
// and rolling up which role(s) and which project(s) they've worked on —
// this is generated automatically, never entered by hand. Ratings are
// looked up separately since they're something you add after the fact.
function buildDirectory(projects, ratings) {
  const byKey = new Map();
  projects.forEach((p) => {
    const contacts = p.contacts || {};
    Object.entries(contacts).forEach(([role, c]) => {
      if (!c || !c.name || !c.name.trim()) return;
      const key = contactKey(c.name, c.mobile);
      if (!byKey.has(key)) {
        byKey.set(key, { key, name: c.name.trim(), email: c.email || "", mobile: c.mobile || "", roles: new Set(), projects: [] });
      }
      const entry = byKey.get(key);
      entry.roles.add(role);
      if (!entry.projects.find((pr) => pr.id === p.id)) entry.projects.push({ id: p.id, name: p.name, no: p.no, status: p.status });
    });
  });
  return Array.from(byKey.values())
    .map((e) => ({ ...e, roles: Array.from(e.roles), rating: (ratings || {})[e.key]?.rating || 0, note: (ratings || {})[e.key]?.note || "" }))
    .sort((a, b) => b.projects.length - a.projects.length || a.name.localeCompare(b.name));
}

// Drawing type -> the task(s) it opens + who's responsible by default.
// Placeholder — swap in the studio's real task map from the
// "Received | Upload" / "Flow | Design" sheets once shared.
const DEFAULT_TEMPLATES = [
  { drawingType: "Layout / Floor Plan", tasks: [{ title: "Fixture layout", assignee: "Riya" }, { title: "Layer & circuiting check", assignee: "Karan" }] },
  { drawingType: "Reflected Ceiling Plan", tasks: [{ title: "Ceiling coordination", assignee: "Karan" }] },
  { drawingType: "Elevation", tasks: [{ title: "Elevation lighting mark-up", assignee: "Priya" }] },
  { drawingType: "Furniture Layout", tasks: [{ title: "Task lighting review", assignee: "Riya" }] },
  { drawingType: "Facade Drawing", tasks: [{ title: "Facade concept", assignee: "Priya" }, { title: "Fixture spec", assignee: "Karan" }] },
  { drawingType: "Landscape Drawing", tasks: [{ title: "Landscape lighting layout", assignee: "Riya" }] },
];

const DEFAULT_PEOPLE = ["Riya", "Karan", "Priya"];

const STATUS = { TODO: "To do", PROGRESS: "In progress", DONE: "Done" };

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
};
const fmtDate = (iso) => {
  if (!iso) return "—";
  const raw = String(iso);
  const d = new Date(raw.length <= 10 ? raw + "T00:00:00" : raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
};
const drawingTypeKey = (v) => {
  const x=String(v||"").trim().toUpperCase();
  if (["LAYOUT","LAYOUT / FLOOR PLAN","FLOOR PLAN"].includes(x)) return "LAYOUT";
  if (["WE","WALL ELECTRICAL","WALL ELECTRICAL DRAWING","WALL ELECTRICAL DRAWINGS"].includes(x)) return "WE";
  if (["FC","FALSE CEILING","FALSE CEILING DRAWING","FALSE CEILING DRAWINGS","REFLECTED CEILING PLAN"].includes(x)) return "FC";
  if (["DETAIL","DETAILS","DETAIL DRAWING","DETAIL DRAWINGS"].includes(x)) return "DETAIL";
  if (["3D","3D RENDER","3D RENDERS"].includes(x)) return "3D";
  return x;
};

const RECEIVED_DRAWING_TYPES = ["Layout","Wall Electrical","False Ceiling","Detail","3D"];
const canonicalDrawingType = (v) => {
  const key=drawingTypeKey(v);
  if(key==="LAYOUT") return "Layout";
  if(key==="WE") return "Wall Electrical";
  if(key==="FC") return "False Ceiling";
  if(key==="DETAIL") return "Detail";
  if(key==="3D") return "3D";
  return String(v||"").trim();
};

/* ---------------------------------------------------------------
   GOOGLE APPS SCRIPT API — v2.3.9 PROJECT CONNECTION
   Phase 1 connects Projects & Scope of Work to Google Sheets.
--------------------------------------------------------------- */
const ENLIGHTEN_API_URL = "/api";

async function apiRequest(action, payload = {}, method = "POST") {
  let response;
  if (method === "GET") {
    const qs = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(payload).map(([k,v]) => [k, String(v)])) });
    response = await fetch(`${ENLIGHTEN_API_URL}?${qs.toString()}`);
  } else {
    response = await fetch(ENLIGHTEN_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, payload })
    });
  }
  const raw = await response.text();
  let json;
  try { json = JSON.parse(raw); }
  catch (_) {
    const html = /^\s*</.test(raw || "");
    throw new Error(html
      ? `Apps Script returned an HTML page for ${action}. Re-deploy the latest backend as a new Web App version, then refresh the app.`
      : `Invalid API response for ${action}.`);
  }
  if (!response.ok || !json?.ok) throw new Error(json?.error?.message || `API request failed: ${action}`);
  return json.data;
}

const projectApi = {
  getCurrentUser: () => apiRequest("getCurrentUser", {}, "GET"),
  listAll: () => apiRequest("listProjects", { activeOnly: false }, "GET"),
  create: payload => apiRequest("createProject", payload),
  update: payload => apiRequest("updateProject", payload),
  delete: projectId => apiRequest("deleteProject", { projectId }),
  complete: projectId => apiRequest("completeProject", { projectId }),
  listContacts: projectId => apiRequest("listProjectContacts", projectId ? { projectId } : {}, "GET"),
  saveContacts: (projectId, contacts) => apiRequest("saveProjectContacts", { projectId, contacts }),
  listLineOfWork: projectId => apiRequest("listLineOfWork", projectId ? { projectId } : {}, "GET"),
  saveLineOfWork: (projectId, rows) => apiRequest("saveLineOfWork", { projectId, rows }),
  listFloorZones: projectId => apiRequest("listFloorZones", projectId ? { projectId } : {}, "GET"),
  saveFloorZones: (projectId, rows) => apiRequest("saveFloorZones", { projectId, rows }),
  receiveDrawing: payload => apiRequest("receiveDrawing", payload),
  classifyDrawing: payload => apiRequest("classifyReceivedDrawing", payload),
  listTeam: () => apiRequest("listTeamMembers", {}, "GET"),
  saveTeamMember: member => apiRequest("saveTeamMember", member),
  deleteTeamMember: userId => apiRequest("deleteTeamMember", { userId }),
  listDepartments: () => apiRequest("listDepartments", {}, "GET"),
  saveDepartment: item => apiRequest("saveDepartment", item),
  listDesignations: () => apiRequest("listDesignations", {}, "GET"),
  saveDesignation: item => apiRequest("saveDesignation", item),
  listDrawingTaskMaster: () => apiRequest("listDrawingTaskMaster", {}, "GET"),
  saveDrawingTaskMaster: templates => apiRequest("saveDrawingTaskMaster", { templates }),
  getDesignDashboard: projectId => apiRequest("getDesignDashboard", { projectId }, "GET"),
  getWIH: (includeCompleted=true, projectId="") => apiRequest("getWIH", { includeCompleted, ...(projectId?{projectId}:{}) }, "GET"),
  assignTask: payload => apiRequest("assignDesignTask", payload),
  startTask: designTaskId => apiRequest("startTask", { designTaskId }),
  pauseTask: designTaskId => apiRequest("pauseTask", { designTaskId }),
  resumeTask: designTaskId => apiRequest("resumeTask", { designTaskId }),
  completeTask: payload => apiRequest("completeTask", payload)
};

function contactCategoryForRole(role) {
  const found = ROLE_CATEGORIES.find(group => group.roles.includes(role));
  return found?.category || "";
}

function contactsObjectToRows(project, contacts) {
  return Object.entries(contacts || {}).filter(([,c]) => c && (c.name || "").trim()).map(([role,c]) => ({
    projectId: project.id,
    projectNo: project.no || "",
    projectName: project.name || "",
    category: contactCategoryForRole(role),
    role,
    name: (c.name || "").trim(),
    email: (c.email || "").trim(),
    mobile: String(c.mobile ?? "").trim(),
    company: (c.company || "").trim(),
    rating: c.rating || ""
  }));
}

function contactRowsToObject(rows) {
  const out = {};
  (rows || []).forEach(r => {
    if (!r?.role || !r?.name) return;
    out[r.role] = {name:r.name||"", email:r.email||"", mobile:r.mobile||"", company:r.company||"", rating:r.rating||""};
  });
  return out;
}

function backendProjectToFrontend(row, fallback = {}) {
  const isTrue = v => v === true || String(v).toLowerCase() === "true";
  const scope = {
    ...(fallback.scope || {}),
    serial: row.projectNo || fallback.no || "", project: row.projectName || fallback.name || "",
    client: row.client || fallback.client || fallback.contacts?.Owner?.name || "",
    architect: row.architect || fallback.architect || fallback.contacts?.Architect?.name || "",
    basement: isTrue(row.basement), stilt_floor: isTrue(row.stiltFloor), gf: isTrue(row.gf),
    "1f": isTrue(row["1f"]), "2f": isTrue(row["2f"]), "3f": isTrue(row["3f"]),
    terrace: isTrue(row.terrace), facade: isTrue(row.facade), wall_elevation: isTrue(row.wallElevation),
    landscape: isTrue(row.landscape), bath_elevation: isTrue(row.bathElevation), wardrobe: isTrue(row.wardrobe),
    kitchen: isTrue(row.kitchen), onboarding: isTrue(row.onboarding)
  };
  const status = row.projectStatus || fallback.status || "Ongoing";
  return {
    ...fallback, id: row.projectId || fallback.id, no: row.projectNo || fallback.no || "",
    name: row.projectName || fallback.name || "",
    client: row.client || fallback.client || fallback.contacts?.Owner?.name || "",
    architect: row.architect || fallback.architect || fallback.contacts?.Architect?.name || "",
    address: row.address || fallback.address || "",
    type: row.projectType || fallback.type || "Residence", startDate: row.startDate || fallback.startDate || "",
    endDate: row.plannedCompletionDate || fallback.endDate || "",
    plannedCompletionDate: row.plannedCompletionDate || fallback.plannedCompletionDate || "",
    projectStage: row.currentStage || fallback.projectStage || "Onboarding", status, projectStatus: status,
    blocker: row.blocker || fallback.blocker || "", delayReason: row.delayReason || fallback.delayReason || "",
    completedDate: row.completedDate || fallback.completedDate || "",
    completedAt: isTrue(row.completed) || status === "Completed" ? (row.updatedAt || row.completedDate || fallback.completedAt || "") : (fallback.completedAt || ""),
    driveFolderId: row.driveFolderId || fallback.driveFolderId || "", scope,
    projectControl: { ...(fallback.projectControl || {}),
      currentStage: row.currentStage || fallback.projectControl?.currentStage || fallback.projectStage || "Onboarding",
      projectStatus: status,
      completedAt: status === "Completed" ? (row.updatedAt || row.completedDate || fallback.projectControl?.completedAt || "") : (fallback.projectControl?.completedAt || "")
    }
  };
}

function frontendProjectToBackend(p, includeId = true) {
  const s = p.scope || {};
  const pc = p.projectControl || {};
  const payload = {
    projectNo: p.no || s.serial || "", projectName: p.name || s.project || "", client: p.client || s.client || "",
    architect: p.architect || s.architect || "", address: p.address || "", projectType: p.type || "Residence",
    startDate: p.startDate || "", plannedCompletionDate: p.plannedCompletionDate || p.endDate || "",
    currentStage: pc.currentStage || p.projectStage || "Onboarding", projectStatus: pc.projectStatus || p.projectStatus || p.status || "Ongoing",
    blocker: p.blocker || pc.blocker || "", delayReason: p.delayReason || pc.delayReason || "",
    basement: Boolean(s.basement), stiltFloor: Boolean(s.stilt_floor), gf: Boolean(s.gf),
    "1f": Boolean(s["1f"]), "2f": Boolean(s["2f"]), "3f": Boolean(s["3f"]), terrace: Boolean(s.terrace),
    facade: Boolean(s.facade), wallElevation: Boolean(s.wall_elevation), landscape: Boolean(s.landscape),
    bathElevation: Boolean(s.bath_elevation), wardrobe: Boolean(s.wardrobe), kitchen: Boolean(s.kitchen), onboarding: Boolean(s.onboarding)
  };
  if (includeId && p.id) payload.projectId = p.id;
  return payload;
}

/* ---------------------------------------------------------------
   STORAGE
--------------------------------------------------------------- */
const STORE_KEY = "lighting-studio-state-v5";

async function localStateGet(key) {
  try {
    if (window.storage?.get) return await window.storage.get(key, false);
  } catch {}
  try {
    const value = window.localStorage.getItem(key);
    return value == null ? null : { value };
  } catch {
    return null;
  }
}

async function localStateSet(key, value) {
  try {
    if (window.storage?.set) {
      const res = await window.storage.set(key, value, false);
      if (res) return true;
    }
  } catch {}
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function normalizeStudioState(base) {
  // v2.11.7: keep drawing-type labels consistent across Received · Upload,
  // Classify and the task master. Older builds stored labels such as
  // "Layout / Floor Plan" or "Reflected Ceiling Plan"; those now map to
  // the same canonical labels used by Received · Upload.
  const rawTemplates = base.templates || DEFAULT_TEMPLATES;
  const templates = rawTemplates.map((t,i) => ({
    ...t,
    drawingType: canonicalDrawingType(t.drawingType),
    sequence: t.sequence || i + 1,
    active: t.active !== false,
    tasks: (t.tasks || []).map((x,j) => ({...x, sequence:x.sequence || j + 1}))
  }));
  // v2.11.4 migration: preserve data saved by older builds that used the misspelled silt_floor key.
  const projects = (base.projects || SEED_PROJECTS).map(p => ({
    ...p,
    scope: p?.scope ? {
      ...p.scope,
      stilt_floor: p.scope.stilt_floor ?? p.scope.silt_floor ?? false
    } : p?.scope
  }));
  const scopeSheet = (base.scopeSheet || PROJECT_SCOPE_SHEET_ROWS).map(r => ({
    ...r,
    stilt_floor: r.stilt_floor ?? r.silt_floor ?? false
  }));
  return {
    projects,
    people: base.people || DEFAULT_PEOPLE,
    teamMaster: base.teamMaster || [],
    templates,
    intakes: base.intakes || [],
    tasks: base.tasks || [],
    ratings: base.ratings || {},
    meetings: base.meetings || [],
    siteVisits: base.siteVisits || [],
    scopeSheet,
  };
}

function useStudioState() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveErr, setSaveErr] = useState(false);
  const [backendErr, setBackendErr] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    (async () => {
      let localState;
      try {
        const res = await localStateGet(STORE_KEY);
        localState = res?.value ? normalizeStudioState(JSON.parse(res.value)) : normalizeStudioState({
          projects: SEED_PROJECTS, people: DEFAULT_PEOPLE, templates: DEFAULT_TEMPLATES, intakes: [], tasks: [], ratings: {}, meetings: [], siteVisits: [], scopeSheet: PROJECT_SCOPE_SHEET_ROWS
        });
      } catch {
        localState = normalizeStudioState({
          projects: SEED_PROJECTS, people: DEFAULT_PEOPLE, templates: DEFAULT_TEMPLATES, intakes: [], tasks: [], ratings: {}, meetings: [], siteVisits: [], scopeSheet: PROJECT_SCOPE_SHEET_ROWS
        });
      }

      try {
        const user = await projectApi.getCurrentUser();
        setCurrentUser(user);
        if (!user?.authorized) {
          setBackendErr(user?.message || "Admin access required.");
          localState = { ...localState, currentUser: user, accessDenied: true };
          setState(localState);
          return;
        }

        const [remote, remoteContacts, remoteLineOfWork, remoteFloorZones, remoteTeam, remoteDepartments, remoteDesignations, remoteDrawingTaskMaster] = await Promise.all([
          projectApi.listAll(),
          projectApi.listContacts().catch(() => []),
          projectApi.listLineOfWork().catch(() => []),
          projectApi.listFloorZones().catch(() => []),
          projectApi.listTeam().catch(() => []),
          projectApi.listDepartments().catch(() => []),
          projectApi.listDesignations().catch(() => []),
          projectApi.listDrawingTaskMaster().catch(() => [])
        ]);
        const contactsByProject = {};
        (remoteContacts || []).forEach(r => {
          if (!contactsByProject[r.projectId]) contactsByProject[r.projectId] = [];
          contactsByProject[r.projectId].push(r);
        });
        const lineWorkByProject = {};
        (remoteLineOfWork || []).forEach(r => {
          if (!lineWorkByProject[r.projectId]) lineWorkByProject[r.projectId] = [];
          lineWorkByProject[r.projectId].push({...r,id:r.lineWorkId||r.id});
        });
        const floorZonesByProject = {};
        (remoteFloorZones || []).forEach(r => {
          if (!floorZonesByProject[r.projectId]) floorZonesByProject[r.projectId] = [];
          floorZonesByProject[r.projectId].push(r);
        });
        if (Array.isArray(remote) && remote.length > 0) {
          const localById = new Map((localState.projects || []).map(p => [String(p.id || ""), p]));
          const localByNo = new Map((localState.projects || []).map(p => [String(p.no || "").trim().toLowerCase(), p]));
          const merged = remote.map(r => {
            const fallback = localById.get(String(r.projectId || "")) ||
              localByNo.get(String(r.projectNo || "").trim().toLowerCase()) || {};
            const base = backendProjectToFrontend(r, fallback);
            const sheetContacts = contactRowsToObject(contactsByProject[r.projectId] || []);
            const sheetLineWork = lineWorkByProject[r.projectId] || [];
            const sheetFloorZones = floorZonesByProject[r.projectId] || [];
            const sheetZones = {};
            sheetFloorZones.forEach(z=>{ if(z.zoneCode) sheetZones[z.zoneCode]={floor:z.floor,room:z.area}; });
            return {...base, contacts: Object.keys(sheetContacts).length ? sheetContacts : (base.contacts || {}),
              ...(sheetLineWork.length ? {lineOfWorkResidence:sheetLineWork,lineOfWork:sheetLineWork} : {}),
              ...(sheetFloorZones.length ? {floorZones:sheetFloorZones,zones:sheetZones} : {})};
          });
          const seen = new Set();
          const deduped = merged.filter(p => {
            const key = String(p.id || p.no || p.name || "").trim().toLowerCase();
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          const activeTeamNames = (remoteTeam || []).filter(m => m.active !== false && String(m.active).toLowerCase() !== "false").map(m => m.name).filter(Boolean);
          localState = { ...localState, projects: deduped, people: activeTeamNames.length ? activeTeamNames : localState.people, teamMaster: remoteTeam || [],
            departmentMaster: (remoteDepartments && remoteDepartments.length) ? remoteDepartments : (localState.departmentMaster || TEAM_DEPARTMENTS.map((name,i)=>({masterId:`DEP-${String(i+1).padStart(3,"0")}`,name,active:true}))),
            designationMaster: (remoteDesignations && remoteDesignations.length) ? remoteDesignations : (localState.designationMaster || TEAM_DESIGNATIONS.map((name,i)=>({masterId:`ROL-${String(i+1).padStart(3,"0")}`,name,active:true}))),
            templates: (remoteDrawingTaskMaster && remoteDrawingTaskMaster.length) ? remoteDrawingTaskMaster : localState.templates
          };
          try { await localStateSet(STORE_KEY, JSON.stringify(localState)); } catch {}
        }
        setBackendErr("");
      } catch (err) {
        setBackendErr(err?.message || "Could not connect to Google Sheets backend");
      } finally {
        setState(localState);
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (next) => {
    setState(next);
    const ok = await localStateSet(STORE_KEY, JSON.stringify(next));
    setSaveErr(!ok);
    return next;
  }, []);

  return { state, loading, saveErr, backendErr, currentUser, persist };
}

/* ---------------------------------------------------------------
   SMALL UI PRIMITIVES
--------------------------------------------------------------- */
function TitleBlock({ view, sub }) {
  const cell = { padding: "10px 16px", borderRight: `1px solid ${T.cyan}33` };
  const label = { fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.12em", color: T.cyan, textTransform: "uppercase", opacity: 0.75 };
  const val = { fontFamily: FONT_DISPLAY, fontSize: 14, color: "#fff", marginTop: 3 };
  return (
    <div style={{ display: "flex", background: T.navy, borderBottom: `1px solid ${T.cyan}33`, flexWrap: "wrap" }}>
      <div style={cell}>
        <div style={label}>Sheet</div>
        <div style={val}>{view}</div>
      </div>
      <div style={cell}>
        <div style={label}>Detail</div>
        <div style={val}>{sub || "—"}</div>
      </div>
      <div style={cell}>
        <div style={label}>Date</div>
        <div style={val}>{fmtDate(todayISO())}</div>
      </div>
      <div style={{ ...cell, borderRight: "none", marginLeft: "auto" }}>
        <div style={label}>Studio</div>
        <div style={val}>Lighting Design Co.</div>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    [STATUS.TODO]: { bg: T.amberBg, fg: T.amber, icon: Circle },
    [STATUS.PROGRESS]: { bg: "#DDE7F5", fg: T.blue, icon: Timer },
    [STATUS.DONE]: { bg: T.greenBg, fg: T.green, icon: CheckCircle2 },
  };
  const s = map[status] || map[STATUS.TODO];
  const Icon = s.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px",
      borderRadius: 20, background: s.bg, color: s.fg, fontFamily: FONT_MONO,
      fontSize: 11, letterSpacing: "0.03em", whiteSpace: "nowrap"
    }}>
      <Icon size={11} strokeWidth={2.5} />{status}
    </span>
  );
}

function Btn({ children, onClick, variant = "primary", style, disabled, type = "button" }) {
  const base = {
    fontFamily: FONT_DISPLAY, fontSize: 13, letterSpacing: "0.02em", padding: "10px 18px",
    borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer", border: "none",
    display: "inline-flex", alignItems: "center", gap: 8, transition: "opacity .15s",
    opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    primary: { background: T.blue, color: "#fff" },
    ghost: { background: "transparent", color: T.ink, border: `1px solid ${T.line}` },
    dark: { background: T.navy, color: "#fff" },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.opacity = "0.85")}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.opacity = "1")}>
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: T.inkDim, marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  );
}

const smallBtn = { padding:"5px 9px", border:`1px solid ${T.line}`, background:"#fff", color:T.ink, cursor:"pointer", fontFamily:FONT_MONO, fontSize:10 };

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.line}`,
  background: "#fff", fontFamily: FONT_BODY, fontSize: 14, color: T.ink, boxSizing: "border-box",
};

function Chip({ active, onClick, children, title }) {
  return (
    <button type="button" title={title} onClick={onClick} style={{
      padding: "6px 12px", borderRadius: 20, fontFamily: FONT_MONO, fontSize: 12,
      border: `1px solid ${active ? T.blue : T.line}`, background: active ? T.blue : "#fff",
      color: active ? "#fff" : T.ink, cursor: "pointer", margin: "3px 6px 3px 0",
    }}>
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------
   VIEW: UPLOAD (Stage 1 of intake)
--------------------------------------------------------------- */
function UploadView({ state, persist }) {
  // Keep this helper local: ProjectsView has its own helper that is not in scope here.
  const uploadProjectIsCompleted = p =>
    p?.status === "Completed" ||
    p?.projectControl?.projectStatus === "Completed" ||
    Boolean(p?.completedAt);
  const activeProjects=(state.projects||[]).filter(p=>!uploadProjectIsCompleted(p));
  const [projectId, setProjectId] = useState(activeProjects[0]?.id || "");
  const [floor, setFloor] = useState("");
  const [drawingType, setDrawingType] = useState(canonicalDrawingType((state.templates||DEFAULT_TEMPLATES)[0]?.drawingType || "Layout"));
  const [file, setFile] = useState(null);
  const [note, setNote] = useState("");
  const [saving,setSaving]=useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const fileRef=useRef(null);

  useEffect(()=>{
    if(activeProjects.length && !activeProjects.some(p=>p.id===projectId)){
      setProjectId(activeProjects[0].id);
    }
  },[state.projects,projectId]);

  useEffect(()=>{
    const first=canonicalDrawingType((state.templates||DEFAULT_TEMPLATES)[0]?.drawingType || "Layout");
    const active=(state.templates||DEFAULT_TEMPLATES).filter(t=>t.active!==false).map(t=>canonicalDrawingType(t.drawingType));
    if(!active.includes(drawingType)) setDrawingType(first);
  },[state.templates]);

  const project=activeProjects.find(p=>p.id===projectId);
  const floorDefs=[
    ["basement","Basement"],["stilt_floor","Stilt Floor"],["gf","GF"],["1f","1F"],["2f","2F"],["3f","3F"],
    ["terrace","Terrace"],["facade","Facade"],["wall_elevation","Wall Elevation"],["landscape","Landscape"],
    ["bath_elevation","Bath Elevation"],["wardrobe","Wardrobe"],["kitchen","Kitchen"]
  ];
  const selectedFloors=(()=>{
    const ps=project?.scope||{};
    return floorDefs.filter(([key])=>Boolean(ps[key])).map(([,label])=>label);
  })();

  useEffect(()=>{
    let live=true;
    setFloor("");
    if(!projectId)return;
    return()=>{live=false;};
  },[projectId]);

  useEffect(()=>{
    if(floor && !selectedFloors.includes(floor)){setFloor("");}
  },[projectId,project?.scope]);

  const fileToBase64=(f)=>new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||"").split(",")[1]||"");
    reader.onerror=reject;
    reader.readAsDataURL(f);
  });

  const submit = async () => {
    if (!projectId || !floor || !drawingType || !file || saving) return;
    setSaving(true);
    try{
      const fileBase64=await fileToBase64(file);
      const saved=await projectApi.receiveDrawing({
        projectId,floor,area:"",drawingType,
        fileName:file.name,mimeType:file.type||"application/octet-stream",fileBase64,
        notes:note,receivedSentDate:todayISO()
      });
      const newIntake={
        id:saved?.drawingId||uid(), projectId, floor, zone:"", areas:[], drawingType:canonicalDrawingType(drawingType),
        fileName:file.name, driveUrl:saved?.driveUrl||"", note, date:saved?.receivedSentDate||todayISO(),
        uploadedAt:saved?.createdAt||new Date().toISOString(), classified:false, source:"Received Upload"
      };
      await persist({ ...state, intakes: [newIntake, ...(state.intakes||[])] });
      setFile(null); setNote("");
      if(fileRef.current)fileRef.current.value="";
      setJustAdded(true); setTimeout(()=>setJustAdded(false),2200);
    }catch(err){
      alert(`Received drawing save failed: ${err?.message||err}`);
    }finally{setSaving(false);}
  };

  const pending = (state.intakes||[]).filter((i) => !i.classified);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
      <div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, margin: "4px 0 18px", color: T.ink }}>Received — Upload</h2>
        <Field label="Project">
          <select style={inputStyle} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {activeProjects.map((p) => <option key={p.id} value={p.id}>{p.no} — {p.name}</option>)}
          </select>
        </Field>

        <Field label="Floor from Project & Scope">
          <select style={inputStyle} value={floor} onChange={(e)=>setFloor(e.target.value)}>
            <option value="">Select floor</option>
            {selectedFloors.map(f=><option key={f} value={f}>{f}</option>)}
          </select>
          {project && selectedFloors.length===0 && <div style={{fontSize:11,color:T.red,marginTop:5}}>No floors selected for this project in Projects & Scope.</div>}
        </Field>

        <Field label="Drawing file">
          <input ref={fileRef} type="file" style={{...inputStyle,padding:8}} onChange={e=>setFile(e.target.files?.[0]||null)} />
          {file && <div style={{fontFamily:FONT_MONO,fontSize:11,marginTop:6,color:T.inkDim}}>{file.name}</div>}
        </Field>

        <Field label="File type">
          <select style={inputStyle} value={drawingType} onChange={e=>setDrawingType(e.target.value)}>
            {(state.templates||DEFAULT_TEMPLATES).filter(t=>t.active!==false).sort((a,b)=>(a.sequence||0)-(b.sequence||0)).map(t=>{
      const label=canonicalDrawingType(t.drawingType);
      return <option key={t.drawingTypeId||t.drawingType} value={label}>{label}</option>;
    })}
          </select>
        </Field>

        <div style={{fontFamily:FONT_MONO,fontSize:11,color:T.blue,margin:"4px 0 16px"}}>ZONE / AREA WILL BE SELECTED BY THE TECHNICAL PERSON IN CLASSIFY.</div>

        <Field label="Note (optional)">
          <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Received via email from architect" />
        </Field>
        <Btn onClick={submit} disabled={!file||!floor||saving}>
          <Upload size={14} /> {saving?"Uploading to Google Drive…":"Log received drawing"}
        </Btn>
        {justAdded && <div style={{ marginTop: 12, fontFamily: FONT_MONO, fontSize: 12, color: T.green }}>Saved to Google Sheets + project Drive folder — technical area classification is the next step →</div>}
      </div>

      <div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, margin: "4px 0 18px", color: T.ink }}>Awaiting classification ({pending.length})</h2>
        {pending.length === 0 && <div style={{ color: T.inkDim, fontFamily: FONT_BODY, fontSize: 13 }}>Nothing waiting — every received drawing has been classified into tasks.</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pending.map((i) => {
            const proj = state.projects.find((p) => p.id === i.projectId);
            return (
              <div key={i.id} style={{ background: "#fff", border: `1px solid ${T.line}`, borderRadius: 8, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: T.ink }}>{i.fileName}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: T.inkDim, marginTop: 2 }}>{proj?.name} · {i.floor||"—"} · {i.zone||"—"} · {i.drawingType||"—"} · {fmtDate(i.date)}</div>
                  {i.driveUrl && <div style={{fontSize:10,marginTop:3,color:T.blue}}>Google Drive attached</div>}
                </div>
                <span style={{ background: T.amberBg, color: T.amber, fontFamily: FONT_MONO, fontSize: 10, padding: "3px 8px", borderRadius: 20 }}>PENDING</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   VIEW: CLASSIFY (Stage 2 — zone letters + drawing type -> tasks)
--------------------------------------------------------------- */
function ClassifyView({ state, persist }) {
  const pending = state.intakes.filter((i) => !i.classified);
  const [selectedId, setSelectedId] = useState(pending[0]?.id || null);
  const [zones, setZones] = useState([]);
  const [drawingType, setDrawingType] = useState(state.templates[0]?.drawingType || "");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!selectedId && pending.length) setSelectedId(pending[0].id);
    if (selectedId && !pending.find((p) => p.id === selectedId)) setSelectedId(pending[0]?.id || null);
    setZones([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending.length]);

  useEffect(() => {
    const selected = state.intakes.find((i) => i.id === selectedId);
    if (selected?.drawingType) setDrawingType(canonicalDrawingType(selected.drawingType));
    setZones([]);
  }, [selectedId]);

  const toggleZone = (z) => setZones((zs) => zs.includes(z) ? zs.filter((x) => x !== z) : [...zs, z]);

  const intake = state.intakes.find((i) => i.id === selectedId);
  const lockedDrawingType = canonicalDrawingType(intake?.drawingType || drawingType);
  const project = intake && state.projects.find((p) => p.id === intake.projectId);
  const letters = project ? sortedZoneLetters(project).filter(z => !intake?.floor || String(project.zones?.[z]?.floor||"") === String(intake.floor)) : [];

  const submit = async () => {
    if (!selectedId || zones.length === 0 || !lockedDrawingType) return;
    const template = state.templates.find((t) => drawingTypeKey(t.drawingType) === drawingTypeKey(lockedDrawingType));

    const newTasks = (template?.tasks || []).map((t) => ({
      id: uid(),
      projectId: project.id,
      projectName: project.name,
      zones: [...zones],
      drawingType:lockedDrawingType,
      title: t.title,
      assignee: t.assignee,
      status: STATUS.TODO,
      date: todayISO(),
      hours: 0,
      sourceFile: intake.fileName,
    }));

    try {
      const areaNames = zones.map(z => project.zones?.[z]?.room || z);
      const saved = await projectApi.classifyDrawing({
        drawingId: selectedId, projectId: project.id, floor: intake.floor,
        areas: areaNames, drawingType:lockedDrawingType
      });
      const backendTasks = Array.isArray(saved?.tasks) ? saved.tasks.map(t => ({
        id:t.designTaskId||uid(), designTaskId:t.designTaskId, designNo:t.designNo,
        projectId:project.id, projectName:project.name, zones:[t.area||""], drawingType:lockedDrawingType,
        title:t.taskType||t.title||"Design Task", assignee:t.assigneeName||"", status:t.status||STATUS.TODO,
        date:todayISO(), hours:Number(t.actualHours||0), sourceFile:intake.fileName
      })) : newTasks;
      const nextIntakes = state.intakes.map((i) => i.id === selectedId ? { ...i, classified: true, zones, areas:areaNames, drawingType:lockedDrawingType } : i);
      await persist({ ...state, intakes: nextIntakes, tasks: [...backendTasks, ...state.tasks] });
    } catch(err) {
      alert(`Classification failed: ${err?.message||err}`); return;
    }
    setZones([]); setDone(true);
    setTimeout(() => setDone(false), 2400);
  };

  const activeTemplate = state.templates.find((t) => drawingTypeKey(t.drawingType) === drawingTypeKey(lockedDrawingType));

  if (pending.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: T.inkDim, fontFamily: FONT_BODY }}>
        <ClipboardCheck size={28} color={T.line} style={{ marginBottom: 10 }} />
        <div>Nothing to classify right now. Upload a drawing first.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 28 }}>
      <div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: T.inkDim, marginBottom: 10 }}>Pending drawings</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {pending.map((i) => {
            const p = state.projects.find((pr) => pr.id === i.projectId);
            const active = i.id === selectedId;
            return (
              <button key={i.id} onClick={() => { setSelectedId(i.id); setZones([]); }} style={{
                textAlign: "left", padding: "10px 12px", borderRadius: 6, cursor: "pointer",
                border: `1px solid ${active ? T.blue : T.line}`, background: active ? "#EAF1FB" : "#fff",
              }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: T.ink }}>{i.fileName}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: T.inkDim }}>{p?.no || "—"} · {p?.name || "Unknown project"}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.inkDim, marginTop: 3 }}>{i.drawingType || "—"} · {fmtDateTime(i.uploadedAt || i.createdAt || i.date)}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, margin: "4px 0 4px", color: T.ink }}>Classify drawing</h2>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.inkDim, marginBottom: 6 }}><strong>{project?.no || "—"} — {project?.name || "Unknown project"}</strong></div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.inkDim, marginBottom: 20 }}>{intake?.fileName} · Uploaded {fmtDateTime(intake?.uploadedAt || intake?.createdAt || intake?.date)}</div>

        <Field label={`Zone(s) — select which lettered zones this drawing covers`}>
          {letters.length === 0 ? (
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.redline, background: T.redlineBg, padding: "10px 12px", borderRadius: 6 }}>
              This project has no zones mapped yet on the Floor | Zone sheet — add its floor/zone breakdown there first.
            </div>
          ) : (
            <div>{letters.map((z) => (
              <Chip key={z} active={zones.includes(z)} onClick={() => toggleZone(z)}>
                {z} <span style={{ opacity: 0.7 }}>| {project.zones[z].floor}{project.zones[z].room ? " | " + project.zones[z].room : ""}</span>
              </Chip>
            ))}</div>
          )}
        </Field>

        {zones.length > 0 && (
          <div style={{ background: T.paperDim, border: `1px solid ${T.line}`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontFamily: FONT_BODY, fontSize: 12.5, color: T.inkDim }}>
            {zones.map((z) => `${z} | ${project.zones[z].floor}${project.zones[z].room ? " | " + project.zones[z].room : ""}`).join("  •  ")}
          </div>
        )}

        <Field label="Drawing type — picked from Received · Upload">
          <div style={{...inputStyle, background:T.paperDim, fontWeight:700}}>{lockedDrawingType || "—"}</div>
          <div style={{fontFamily:FONT_MONO,fontSize:10,color:T.green,marginTop:5}}>LOCKED FROM UPLOAD — select Zone / Area below/above to classify.</div>
        </Field>

        {activeTemplate && (
          <div style={{ background: T.paperDim, border: `1px solid ${T.line}`, borderRadius: 8, padding: "12px 14px", marginBottom: 20 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.inkDim, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Will auto-open</div>
            {activeTemplate.tasks.map((t, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_BODY, fontSize: 13, padding: "4px 0" }}>
                <span>{t.title}</span>
                <span style={{ color: T.blue, fontFamily: FONT_MONO, fontSize: 12 }}>{t.assignee}</span>
              </div>
            ))}
          </div>
        )}

        <Btn onClick={submit} disabled={zones.length === 0}>
          <ClipboardCheck size={14} /> Open tasks in timesheet
        </Btn>
        {done && <div style={{ marginTop: 12, fontFamily: FONT_MONO, fontSize: 12, color: T.green }}>Tasks created and assigned.</div>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   VIEW: TIMESHEET
--------------------------------------------------------------- */
function TimesheetView({ state, persist }) {
  const [person, setPerson] = useState("All");
  const [taskSection, setTaskSection] = useState("Pending");
  const WIH_CACHE_KEY = "enlighten_wih_cache_v2108";
  const WIH_CACHE_MS = 30000;
  const readWihCache = () => {
    try {
      const x = JSON.parse(localStorage.getItem(WIH_CACHE_KEY) || "null");
      return x && Array.isArray(x.rows) ? x : null;
    } catch (_) { return null; }
  };
  const initialWihCache = readWihCache();
  const [remoteTasks, setRemoteTasks] = useState(() => initialWihCache?.rows || []);
  const [loadingRemote, setLoadingRemote] = useState(() => !(initialWihCache?.rows?.length));
  const [syncingRemote, setSyncingRemote] = useState(false);
  const [completeEditor, setCompleteEditor] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkProjectId, setBulkProjectId] = useState("");
  const [bulkAssignments, setBulkAssignments] = useState({});
  const [bulkSaving, setBulkSaving] = useState(false);
  const activeTeam=(state.teamMaster||[]).filter(m=>m.active!==false&&String(m.active).toLowerCase()!=="false");
  const teamNames=activeTeam.map(m=>m.name).filter(Boolean);

  const refresh=async(force=false)=>{
    const cached = readWihCache();
    const freshCache = cached && (Date.now() - Number(cached.savedAt || 0) < WIH_CACHE_MS);
    if (!force && freshCache) {
      setRemoteTasks(cached.rows);
      setLoadingRemote(false);
      return;
    }
    if (!remoteTasks.length) setLoadingRemote(true);
    setSyncingRemote(true);
    try{
      // WIH must show EVERY real Design Task / Design No. across every active project.
      // getWIH can contain only tasks that already have a WIH/timesheet row, so merge it
      // with each project's authoritative Design Dashboard task IDs from Google Sheets.
      const wihRows=await projectApi.getWIH(true);
      const base=Array.isArray(wihRows)?wihRows:[];
      const byId=new Map(base.filter(r=>r?.designTaskId).map(r=>[String(r.designTaskId),r]));
      const taskDefs=[
        {id:"conceptTaskId",no:"conceptDesignNo",st:"conceptStatus",title:"Concept | 2D | Preliminary Budgeting",drawingType:"Layout"},
        {id:"renders3dTaskId",no:"renders3dDesignNo",st:"renders3dStatus",title:"3D Renders",drawingType:"3D"},
        {id:"decorativeSelectionTaskId",no:"decorativeSelectionDesignNo",st:"decorativeSelectionStatus",title:"Decorative Selection",drawingType:"Detail"},
        {id:"wallElectricalTaskId",no:"wallElectricalDesignNo",st:"wallElectricalStatus",title:"Wall Electricals Drawings",drawingType:"Wall Electrical"},
        {id:"falseCeilingTaskId",no:"falseCeilingDesignNo",st:"falseCeilingStatus",title:"False Ceiling Drawings",drawingType:"False Ceiling"},
        {id:"lightTaskId",no:"lightDesignNo",st:"lightStatus",title:"LIGHT Drawings",drawingType:"Layout"},
        {id:"slabElectricalTaskId",no:"slabElectricalDesignNo",st:"slabElectricalStatus",title:"Slab Electrical Drawings",drawingType:"Wall Electrical"},
        {id:"facadeElevationTaskId",no:"facadeElevationDesignNo",st:"facadeElevationStatus",title:"Facade Elevation Drawings",drawingType:"Detail"},
        {id:"bathroomElevationTaskId",no:"bathroomElevationDesignNo",st:"bathroomElevationStatus",title:"Bathroom Elevation",drawingType:"Detail"},
        {id:"documentationBoqTaskId",no:"documentationBoqDesignNo",st:"documentationBoqStatus",title:"Documentation & BOQ",drawingType:"Detail"},
        {id:"furnitureTaskId",no:"furnitureDesignNo",st:"furnitureStatus",title:"Furniture / Joinery",drawingType:"Detail"}
      ];
      const projects=(state.projects||[]).filter(p=>!p.completed&&!/completed/i.test(String(p.projectStatus||p.status||"")));
      const dashboards=await Promise.all(projects.map(async p=>{
        try{return {p,payload:await projectApi.getDesignDashboard(p.id)};}catch(e){console.warn("WIH dashboard sync failed",p.id,e);return {p,payload:null};}
      }));
      dashboards.forEach(({p,payload})=>{
        const rows=Array.isArray(payload?.rows)?payload.rows:[];
        rows.forEach(r=>taskDefs.forEach(d=>{
          const taskId=String(r?.[d.id]||"").trim();
          const designNo=String(r?.[d.no]||"").trim();
          if(!taskId&&!designNo)return;
          const key=taskId||designNo;
          const existing=byId.get(key)||base.find(x=>String(x?.task?.designNo||"")===designNo);
          if(existing){
            byId.set(key,{...existing,designTaskId:taskId||existing.designTaskId,projectId:p.id,task:{...(existing.task||{}),taskType:d.title,projectName:p.name,floor:r.floor||existing.task?.floor||"",area:r.area||existing.task?.area||"",dependencyDrawingType:d.drawingType,designNo:designNo||existing.task?.designNo||"",status:r?.[d.st]||existing.task?.status||existing.status||"Not Started"},status:r?.[d.st]||existing.status||existing.task?.status||"Not Started"});
          }else{
            byId.set(key,{designTaskId:taskId||key,projectId:p.id,assigneeName:"",totalMinutes:0,status:String(r?.[d.st]||"Not Started"),task:{taskType:d.title,projectName:p.name,floor:r.floor||"",area:r.area||"",dependencyDrawingType:d.drawingType,designNo:designNo||key,status:String(r?.[d.st]||"Not Started")}});
          }
        }));
      });
      const nextRows=[...byId.values()];
      setRemoteTasks(nextRows);
      try { localStorage.setItem(WIH_CACHE_KEY, JSON.stringify({savedAt:Date.now(), rows:nextRows})); } catch (_) {}
    }
    catch(e){
      console.warn("WIH backend load failed",e);
      // Keep the last cached/current rows visible if Google Sheets is temporarily slow.
    }
    finally{setLoadingRemote(false);setSyncingRemote(false);}
  };
  useEffect(()=>{
    const cached = readWihCache();
    if (cached?.rows?.length) {
      setRemoteTasks(cached.rows);
      setLoadingRemote(false);
      // Show cache immediately, then silently check for newer Google Sheets data.
      refresh(true);
    } else {
      refresh(true);
    }
  },[]);

  const displayTasks=remoteTasks.length?remoteTasks.map(r=>({
    ...r,
    id:r.designTaskId,
    designTaskId:r.designTaskId,
    projectId:r.projectId,
    title:r.task?.taskType||"Design Task",
    projectName:(state.projects||[]).find(p=>String(p.id)===String(r.projectId))?.name||r.task?.projectName||"",
    floor:r.task?.floor||"",
    area:r.task?.area||"",
    drawingType:r.task?.dependencyDrawingType||"",
    designNo:r.task?.designNo||"",
    assignee:r.assigneeName||r.task?.assigneeName||"",
    hours:Number(r.totalMinutes||0)/60,
    status:String(r.status||r.task?.status||"Not Started")
  })):(state.tasks||[]);
  const isDone=s=>/completed|done/i.test(String(s));
  const isProgress=s=>/in progress/i.test(String(s));
  const isPaused=s=>/paused/i.test(String(s));
  const sectionCounts={
    Pending:displayTasks.filter(t=>!isDone(t.status)&&!!t.assignee).length,
    Completed:displayTasks.filter(t=>isDone(t.status)).length,
    Unallotted:displayTasks.filter(t=>!isDone(t.status)&&!t.assignee).length,
    All:displayTasks.length
  };
  const sectionTasks=displayTasks.filter(t=>taskSection==="All"?true:taskSection==="Completed"?isDone(t.status):taskSection==="Unallotted"?!isDone(t.status)&&!t.assignee:!isDone(t.status)&&!!t.assignee);
  const tasks=sectionTasks.filter(t=>person==="All"||t.assignee===person);
  const people=[...new Set([...(teamNames.length?teamNames:(state.people||[])),...displayTasks.map(t=>t.assignee).filter(Boolean)])];
  const bulkProjects=[...new Map(displayTasks.filter(t=>!isDone(t.status)).map(t=>[String(t.projectId),{id:String(t.projectId),name:t.projectName||String(t.projectId)}])).values()];
  const bulkProjectTasks=displayTasks.filter(t=>String(t.projectId)===String(bulkProjectId)&&!isDone(t.status)&&t.designTaskId);
  const bulkTaskGroups=[...new Map(bulkProjectTasks.map(t=>[t.title,{title:t.title,tasks:bulkProjectTasks.filter(x=>x.title===t.title)}])).values()];
  const openBulkAssign=()=>{
    const first=bulkProjects[0]?.id||"";
    setBulkProjectId(first);
    setBulkAssignments({});
    setBulkAssignOpen(true);
  };
  const saveBulkAssignments=async()=>{
    const selected=bulkTaskGroups.filter(g=>bulkAssignments[g.title]);
    if(!bulkProjectId)return alert("Select a project.");
    if(!selected.length)return alert("Select a team member for at least one task type.");
    setBulkSaving(true);
    try{
      for(const group of selected){
        const name=bulkAssignments[group.title];
        const member=activeTeam.find(m=>m.name===name);
        for(const t of group.tasks){
          await projectApi.assignTask({designTaskId:t.designTaskId,assigneeUserId:member?.userId||member?.employeeId||"",assigneeName:name});
        }
      }
      await refresh(true);
      setBulkAssignOpen(false);
    }catch(e){alert(`Project task assignment failed: ${e?.message||e}`);}
    finally{setBulkSaving(false);}
  };

  const assign=async(t,name)=>{
    if(!t.designTaskId)return;
    const member=activeTeam.find(m=>m.name===name);
    setBusyId(t.designTaskId);
    try{await projectApi.assignTask({designTaskId:t.designTaskId,assigneeUserId:member?.userId||member?.employeeId||"",assigneeName:name});await refresh(true);}
    catch(e){alert(`Task assignment failed: ${e?.message||e}`);}finally{setBusyId("");}
  };
  const action=async(t,kind)=>{
    if(!t.designTaskId)return;
    setBusyId(t.designTaskId);
    try{if(kind==="start")await projectApi.startTask(t.designTaskId);if(kind==="pause")await projectApi.pauseTask(t.designTaskId);if(kind==="resume")await projectApi.resumeTask(t.designTaskId );await refresh(true);}
    catch(e){alert(`Task update failed: ${e?.message||e}`);}finally{setBusyId("");}
  };
  const fileToBase64=f=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||"").split(",")[1]||"");r.onerror=reject;r.readAsDataURL(f);});
  const finish=async()=>{
    const x=completeEditor;if(!x?.file)return alert("Please upload the completed drawing/file.");
    const hrs=Number(x.actualHours);if(!hrs||hrs<=0)return alert("Please enter actual time taken in hours.");
    setBusyId(x.task.designTaskId);
    try{const fileBase64=await fileToBase64(x.file);await projectApi.completeTask({designTaskId:x.task.designTaskId,fileName:x.file.name,mimeType:x.file.type||"application/octet-stream",fileBase64,actualHours:hrs,notes:x.notes||""});setCompleteEditor(null );await refresh(true);}
    catch(e){alert(`Task completion failed: ${e?.message||e}`);}finally{setBusyId("");}
  };
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
      <div><h2 style={{fontFamily:FONT_DISPLAY,fontSize:20,margin:0,color:T.ink}}>WIH Sheet</h2><div style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim,marginTop:4}}>Assigned drawing tasks appear here. Completion requires output upload + actual time taken. <span style={{fontFamily:FONT_MONO,fontSize:10,color:syncingRemote?T.orange:T.green}}>{syncingRemote?"• Syncing Google Sheets…":"• Synced"}</span></div></div>
    </div>
    <div style={{background:"#fff",border:`1px solid ${T.line}`,borderRadius:8,padding:"12px 14px",marginBottom:14}}>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:10}}>
        <span style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim,marginRight:4}}>TASK SECTION</span>
        {["Pending","Completed","Unallotted","All"].map(x=><Chip key={x} active={taskSection===x} onClick={()=>setTaskSection(x)}>{x} ({sectionCounts[x]})</Chip>)}
        <button onClick={openBulkAssign} disabled={!bulkProjects.length} style={{...smallBtn,background:T.navy,color:"#fff",padding:"9px 13px",marginLeft:"auto"}}>PROJECT-WISE ASSIGNMENT</button>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim,marginRight:4}}>EMPLOYEE</span>
        <Chip active={person==="All"} onClick={()=>setPerson("All")}>All Employees</Chip>{people.map(p=><Chip key={p} active={person===p} onClick={()=>setPerson(p)}>{p}</Chip>)}
      </div>
    </div>
    {loadingRemote&&remoteTasks.length===0&&<div style={{fontFamily:FONT_BODY,color:T.inkDim,padding:"10px 0"}}>Loading WIH tasks for the first time…</div>}
    {!loadingRemote&&tasks.length===0&&<div style={{color:T.inkDim,fontFamily:FONT_BODY,fontSize:13,padding:"20px 0"}}>No WIH tasks yet. Received drawings create tasks automatically.</div>}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>{tasks.map(t=><div key={t.id} style={{background:"#fff",border:`1px solid ${T.line}`,borderRadius:8,padding:"12px 14px",display:"grid",gridTemplateColumns:"1.5fr 1fr 150px 90px 230px",gap:10,alignItems:"center"}}>
      <div><div style={{fontFamily:FONT_BODY,fontSize:13,fontWeight:700}}>{t.title}</div><div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim,marginTop:3}}>{t.projectName} · {t.floor||"—"} · {t.area||"—"} · {t.drawingType||"—"}</div>{t.designNo&&<div style={{fontFamily:FONT_MONO,fontSize:11,color:T.blue,fontWeight:800,marginTop:3}}>{t.designNo}</div>}</div>
      <select disabled={!t.designTaskId||busyId===t.designTaskId||isDone(t.status)} value={t.assignee||""} onChange={e=>assign(t,e.target.value)} style={{...inputStyle,padding:"7px 8px",fontSize:12}}><option value="">Assign team member</option>{people.map(n=><option key={n}>{n}</option>)}</select>
      <StatusPill status={isDone(t.status)?"Done":isProgress(t.status)?"In progress":"To do"}/>
      <div style={{fontFamily:FONT_MONO,fontSize:12}}>{Number(t.hours||0).toFixed(2)} h</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{!isDone(t.status)&&!isProgress(t.status)&&!isPaused(t.status)&&<button disabled={!t.assignee||busyId===t.designTaskId} onClick={()=>action(t,"start")} style={smallBtn}>START</button>}{isProgress(t.status)&&<button disabled={busyId===t.designTaskId} onClick={()=>action(t,"pause")} style={smallBtn}>PAUSE</button>}{isPaused(t.status)&&<button disabled={busyId===t.designTaskId} onClick={()=>action(t,"resume")} style={smallBtn}>RESUME</button>}{!isDone(t.status)&&<button disabled={!t.assignee||busyId===t.designTaskId} onClick={()=>setCompleteEditor({task:t,file:null,actualHours:t.hours||"",notes:""})} style={{...smallBtn,background:T.navy,color:"#fff"}}>COMPLETE / UPLOAD</button>}</div>
    </div>)}</div>
    {bulkAssignOpen&&<div style={{position:"fixed",inset:0,zIndex:13900,background:"rgba(8,25,45,.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{width:"min(760px,96vw)",maxHeight:"88vh",overflow:"auto",background:T.paper,border:`1px solid ${T.line}`}}><div style={{background:T.navy,color:"#fff",padding:15,fontFamily:FONT_DISPLAY,fontSize:19}}>Project-wise Task Assignment</div><div style={{padding:16}}><div style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim,marginBottom:14}}>Select one project, then assign each task type once. The selected team member will be applied to every open task of that type in this project.</div><Field label="PROJECT"><select value={bulkProjectId} onChange={e=>{setBulkProjectId(e.target.value);setBulkAssignments({});}} style={inputStyle}>{bulkProjects.map(p=><option key={p.id} value={p.id}>{p.no||p.projectNo||"—"} — {p.name}</option>)}</select></Field>{bulkTaskGroups.length===0?<div style={{fontFamily:FONT_BODY,color:T.inkDim,padding:"14px 0"}}>No open WIH tasks for this project.</div>:<div style={{border:`1px solid ${T.line}`}}>{bulkTaskGroups.map(g=><div key={g.title} style={{display:"grid",gridTemplateColumns:"1.4fr 90px 1fr",gap:10,alignItems:"center",padding:"11px 12px",borderBottom:`1px solid ${T.line}`,background:"#fff"}}><div><div style={{fontFamily:FONT_BODY,fontWeight:700,fontSize:13}}>{g.title}</div><div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim}}>{g.tasks.length} open task{g.tasks.length===1?"":"s"}</div></div><div style={{fontFamily:FONT_MONO,fontSize:11,color:T.inkDim}}>{[...new Set(g.tasks.map(t=>t.floor).filter(Boolean))].join(", ")||"—"}</div><select value={bulkAssignments[g.title]||""} onChange={e=>setBulkAssignments(x=>({...x,[g.title]:e.target.value}))} style={{...inputStyle,padding:"7px 8px",fontSize:12}}><option value="">Keep current / unassigned</option>{people.map(n=><option key={n}>{n}</option>)}</select></div>)}</div>}<div style={{marginTop:12,fontFamily:FONT_MONO,fontSize:11,color:T.inkDim}}>{bulkProjectTasks.length} total open task{bulkProjectTasks.length===1?"":"s"} in selected project.</div></div><div style={{padding:14,borderTop:`1px solid ${T.line}`,display:"flex",justifyContent:"flex-end",gap:8}}><button disabled={bulkSaving} onClick={()=>setBulkAssignOpen(false)} style={{...smallBtn,background:"#fff"}}>Cancel</button><button disabled={bulkSaving||!bulkTaskGroups.length} onClick={saveBulkAssignments} style={{...smallBtn,background:T.navy,color:"#fff",padding:"9px 14px"}}>{bulkSaving?"SAVING…":"SAVE PROJECT ASSIGNMENTS"}</button></div></div></div>}
    {completeEditor&&<div style={{position:"fixed",inset:0,zIndex:14000,background:"rgba(8,25,45,.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{width:"min(650px,96vw)",background:T.paper,border:`1px solid ${T.line}`}}><div style={{background:T.navy,color:"#fff",padding:14,fontFamily:FONT_DISPLAY,fontSize:18}}>Complete WIH Task · {completeEditor.task.designNo||completeEditor.task.title}</div><div style={{padding:16}}><Field label="Completed drawing / output file *"><input type="file" style={{...inputStyle,padding:8}} onChange={e=>setCompleteEditor(x=>({...x,file:e.target.files?.[0]||null}))}/></Field><Field label="Actual time taken (hours) *"><input type="number" min="0.01" step="0.25" value={completeEditor.actualHours} onChange={e=>setCompleteEditor(x=>({...x,actualHours:e.target.value}))} style={inputStyle}/></Field><Field label="Completion remarks"><textarea value={completeEditor.notes} onChange={e=>setCompleteEditor(x=>({...x,notes:e.target.value}))} style={{...inputStyle,minHeight:70}}/></Field></div><div style={{padding:14,borderTop:`1px solid ${T.line}`,display:"flex",justifyContent:"flex-end",gap:8}}><button onClick={()=>setCompleteEditor(null)} style={{...smallBtn,background:"#fff"}}>Cancel</button><button onClick={finish} style={{...smallBtn,background:T.navy,color:"#fff"}}>Upload & Complete Task</button></div></div></div>}
  </div>;
}

/* ---------------------------------------------------------------
   VIEW: DASHBOARD — the Floor | Zone matrix from the sheet:
   projects across the top, zone letters down the side, each cell
   showing that zone's floor + room, colored by live task status.
--------------------------------------------------------------- */
function DashboardView({ state, persist }) {
  const [projectId,setProjectId]=useState("");
  const [editor,setEditor]=useState(null);
  const [bulkEditor,setBulkEditor]=useState(null);
  const projects=(state.projects||[]).filter(p=>p.status!=="Completed"&&p.projectControl?.projectStatus!=="Completed");
  const project=projects.find(p=>String(p.id)===String(projectId))||null;
  const scopeFloors=project?designDashboardScopeFloors(project):[];
  const rows=project?(project.floorZones||Object.entries(project.zones||{}).map(([zoneCode,v],i)=>({floorZoneId:"",zoneCode,floor:v?.floor||"",area:v?.room||"",seq:i+1}))):[];

  const addRow=f=>setEditor({mode:"add",floorZoneId:"",zoneCode:"",floor:f||scopeFloors[0]||"",area:""});
  const editRow=r=>setEditor({mode:"edit",floorZoneId:r.floorZoneId||"",zoneCode:r.zoneCode||"",floor:r.floor||"",area:r.area||r.room||""});
  const save=async()=>{
    if(!project||!editor?.floor||!editor?.area?.trim())return alert("Select a floor and enter Area / Room.");
    let zoneCode=String(editor.zoneCode||"").trim().toUpperCase();
    if(!zoneCode)return alert("Enter the Zone Code. Zone Code must be added by the doer.");
    const used=new Set(rows.map(r=>String(r.zoneCode||"").toUpperCase()).filter(Boolean));
    const duplicate=rows.some(r=>{
      const sameRow=editor.floorZoneId?String(r.floorZoneId||"")===String(editor.floorZoneId):String(r.zoneCode||"").toUpperCase()===String(editor.zoneCode||"").toUpperCase();
      return !sameRow&&String(r.zoneCode||"").toUpperCase()===zoneCode;
    });
    if(duplicate)return alert(`Duplicate Zone Code: ${zoneCode}`);
    let next;
    if(editor.mode==="edit"){
      next=rows.map(r=>(editor.floorZoneId&&r.floorZoneId===editor.floorZoneId)||(!editor.floorZoneId&&r.zoneCode===editor.zoneCode)?{...r,zoneCode,floor:editor.floor,area:editor.area.trim()}:r);
    }else next=[...rows,{floorZoneId:"",zoneCode,floor:editor.floor,area:editor.area.trim(),seq:rows.length+1}];
    try{
      const saved=await projectApi.saveFloorZones(project.id,next);
      const finalRows=(saved||next);
      const zones={}; finalRows.forEach(r=>{zones[r.zoneCode]={floor:r.floor,room:r.area};});
      const updated={...project,floorZones:finalRows,zones};
      await persist({...state,projects:(state.projects||[]).map(p=>p.id===project.id?updated:p)});
      setEditor(null);
    }catch(e){alert(`Floor / Zone save failed: ${e?.message||e}`);}
  };

  const parseBulkPreview=()=>{
    if(!project||!bulkEditor)return [];
    const lines=String(bulkEditor.text||"").split(/\r?\n/).map((x,i)=>({raw:x.trim(),lineIndex:i})).filter(x=>x.raw);
    const usedFloors=new Set(scopeFloors);
    return lines.map(item=>{
      const parts=item.raw.split("|");
      const zoneCode=String(parts.shift()||"").trim().toUpperCase();
      const area=parts.join("|").trim();
      const floor=String(bulkEditor.floor||scopeFloors[0]||"").trim();
      return {lineIndex:item.lineIndex,zoneCode,floor,area,valid:usedFloors.has(floor)&&!!zoneCode&&!!area};
    });
  };

  const saveBulk=async()=>{
    if(!project||!bulkEditor)return;
    const preview=parseBulkPreview();
    if(!preview.length)return alert("Enter at least one Zone Code | Area / Room line.");
    const invalid=preview.find(x=>!x.valid);
    if(invalid)return alert(`Invalid line ${invalid.lineIndex+1}. Use: Zone Code | Area / Room\nExample: A | Living Room`);

    const used=new Set(rows.map(r=>String(r.zoneCode||"").toUpperCase()).filter(Boolean));
    const pending=[];
    for(const item of preview){
      const zoneCode=item.zoneCode;
      if(used.has(zoneCode)||pending.some(r=>r.zoneCode===zoneCode)) return alert(`Duplicate Zone Code: ${zoneCode}`);
      pending.push({floorZoneId:"",zoneCode,floor:item.floor,area:item.area.trim(),seq:rows.length+pending.length+1});
      used.add(zoneCode);
    }

    const next=[...rows,...pending];
    try{
      const saved=await projectApi.saveFloorZones(project.id,next);
      const finalRows=(saved||next);
      const zones={}; finalRows.forEach(r=>{zones[r.zoneCode]={floor:r.floor,room:r.area};});
      const updated={...project,floorZones:finalRows,zones};
      await persist({...state,projects:(state.projects||[]).map(p=>p.id===project.id?updated:p)});
      setBulkEditor(null);
    }catch(e){alert(`Bulk Floor / Zone save failed: ${e?.message||e}`);}
  };
  const remove=async r=>{
    if(!project)return;
    const next=rows.filter(x=>x!==r && !(r.floorZoneId&&x.floorZoneId===r.floorZoneId));
    try{
      const saved=await projectApi.saveFloorZones(project.id,next);
      const finalRows=saved||next,zones={}; finalRows.forEach(x=>{zones[x.zoneCode]={floor:x.floor,room:x.area};});
      const updated={...project,floorZones:finalRows,zones};
      await persist({...state,projects:(state.projects||[]).map(p=>p.id===project.id?updated:p)});
    }catch(e){alert(`Floor / Zone delete failed: ${e?.message||e}`);}
  };

  return <div>
    <h2 style={{fontFamily:FONT_DISPLAY,fontSize:22,margin:"4px 0"}}>Floor / Zone</h2>
    <div style={{fontFamily:FONT_BODY,fontSize:13,color:T.inkDim,marginBottom:16}}>Projects come from Project → Projects & Scope. Only floors selected in that project's scope are available here. Saved areas automatically flow into Design Dashboard.</div>
    <div style={{border:`1px solid ${T.line}`,background:"#fff",marginBottom:18,overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,tableLayout:"fixed"}}>
        <colgroup><col style={{width:"9%"}}/><col style={{width:"18%"}}/><col style={{width:"55%"}}/><col style={{width:"8%"}}/><col style={{width:"10%"}}/></colgroup>
        <thead><tr style={{background:T.paper2}}>{["Project No.","Project","Scope / Floors","Areas","Action"].map(h=><th key={h} style={{padding:10,textAlign:"left",borderBottom:`1px solid ${T.line}`,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
        <tbody>{projects.map(p=>{const count=(p.floorZones||Object.keys(p.zones||{})).length;return <tr key={p.id}>
          <td style={{padding:10,borderBottom:`1px solid ${T.line}`,fontFamily:FONT_MONO}}>{p.no||p.projectNo}</td>
          <td style={{padding:10,borderBottom:`1px solid ${T.line}`,fontWeight:700}}>{p.name}</td>
          <td style={{padding:10,borderBottom:`1px solid ${T.line}`,whiteSpace:"normal",overflowWrap:"anywhere",wordBreak:"break-word",lineHeight:1.45,minWidth:260,maxWidth:520}}>{designDashboardScopeFloors(p).join(", ")||"No scope selected"}</td>
          <td style={{padding:10,borderBottom:`1px solid ${T.line}`}}>{count}</td>
          <td style={{padding:10,borderBottom:`1px solid ${T.line}`}}><button type="button" onClick={()=>setProjectId(String(p.id))} style={{...smallBtn,background:T.navy,color:"#fff"}}>OPEN</button></td>
        </tr>})}</tbody>
      </table>
    </div>

    {project&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div><div style={{fontFamily:FONT_MONO,fontSize:10,color:T.cyan}}>SELECTED PROJECT · {project.no||project.projectNo}</div><h3 style={{fontFamily:FONT_DISPLAY,fontSize:20,margin:"3px 0"}}>{project.name}</h3></div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}><button type="button" disabled={!scopeFloors.length} onClick={()=>setBulkEditor({floor:scopeFloors[0]||"",text:""})} style={{...smallBtn,background:T.navy,color:"#fff",padding:"9px 14px"}}>+ BULK ADD AREAS</button><button type="button" disabled={!scopeFloors.length} onClick={()=>addRow(scopeFloors[0])} style={{...smallBtn,background:"#fff",padding:"9px 14px"}}>+ ADD ONE</button></div>
      </div>
      {scopeFloors.map(f=>{const fr=rows.filter(r=>String(r.floor)===f);return <div key={f} style={{border:`1px solid ${T.line}`,background:"#fff",marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",padding:"10px 12px",background:T.paper2,borderBottom:`1px solid ${T.line}`}}><strong>{f} · {fr.length} areas</strong><button type="button" onClick={()=>addRow(f)} style={{...smallBtn,background:"#fff"}}>+ AREA</button></div>
        <div style={{display:"grid",gridTemplateColumns:"100px 1fr 180px",fontSize:11,fontWeight:700,borderBottom:`1px solid ${T.line}`}}><div style={{padding:8}}>Zone</div><div style={{padding:8}}>Area / Room</div><div style={{padding:8}}>Action</div></div>
        {fr.map((r,i)=><div key={r.floorZoneId||r.zoneCode||i} style={{display:"grid",gridTemplateColumns:"100px 1fr 180px",fontSize:12,borderBottom:i<fr.length-1?`1px solid ${T.line}`:"none"}}><div style={{padding:8,fontFamily:FONT_MONO}}>{r.zoneCode||"—"}</div><div style={{padding:8,fontWeight:600}}>{r.area||r.room}</div><div style={{padding:6,display:"flex",gap:6}}><button type="button" onClick={()=>editRow(r)} style={{...smallBtn,background:"#fff"}}>EDIT</button><button type="button" onClick={()=>remove(r)} style={{...smallBtn,background:"#fff"}}>DELETE</button></div></div>)}
        {!fr.length&&<div style={{padding:10,fontSize:11,color:T.inkDim}}>No areas entered for {f}.</div>}
      </div>})}
    </div>}

    {editor&&project&&<div style={{position:"fixed",inset:0,zIndex:13000,background:"rgba(8,25,45,.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"min(650px,96vw)",background:T.paper,border:`1px solid ${T.line}`}}>
        <div style={{background:T.navy,color:"#fff",padding:14,fontFamily:FONT_DISPLAY,fontSize:18}}>{editor.mode==="edit"?"Edit":"Add"} Floor / Zone · {project.no}</div>
        <div style={{padding:16,display:"grid",gridTemplateColumns:"160px 1fr",gap:12}}>
          <Field label="Zone Code"><input value={editor.zoneCode} onChange={e=>setEditor(x=>({...x,zoneCode:e.target.value.toUpperCase()}))} placeholder="Enter Zone Code (e.g. A)" style={inputStyle}/></Field>
          <Field label="Floor from Project Scope"><select value={editor.floor} onChange={e=>setEditor(x=>({...x,floor:e.target.value}))} style={inputStyle}>{scopeFloors.map(f=><option key={f}>{f}</option>)}</select></Field>
          <div style={{gridColumn:"1 / -1"}}><Field label="Area / Room"><input value={editor.area} onChange={e=>setEditor(x=>({...x,area:e.target.value}))} placeholder="Living Room, Bedroom, Washroom..." style={inputStyle}/></Field></div>
        </div>
        <div style={{padding:14,borderTop:`1px solid ${T.line}`,display:"flex",justifyContent:"flex-end",gap:8}}><button type="button" onClick={()=>setEditor(null)} style={{...smallBtn,background:"#fff"}}>Cancel</button><button type="button" onClick={save} style={{...smallBtn,background:T.navy,color:"#fff"}}>Save Floor / Zone</button></div>
      </div>
    </div>}

    {bulkEditor&&project&&<div style={{position:"fixed",inset:0,zIndex:13000,background:"rgba(8,25,45,.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"min(760px,96vw)",background:T.paper,border:`1px solid ${T.line}`,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{background:T.navy,color:"#fff",padding:14,fontFamily:FONT_DISPLAY,fontSize:18}}>Bulk Add Areas / Zones · {project.no}</div>
        <div style={{padding:16}}>
          <div style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim,marginBottom:12}}>Add many rooms/spaces in one save. Enter <b>Zone Code | Area / Room</b>, one per line. The selected floor above is applied to every line. Zone Code must be entered by the doer.</div>
          <Field label="Default Floor">
            <select value={bulkEditor.floor} onChange={e=>setBulkEditor(x=>({...x,floor:e.target.value}))} style={inputStyle}>{scopeFloors.map(f=><option key={f}>{f}</option>)}</select>
          </Field>
          <div style={{marginTop:12}}>
            <Field label="Areas / Rooms — one per line">
              <textarea autoFocus value={bulkEditor.text} onChange={e=>setBulkEditor(x=>({...x,text:e.target.value}))} placeholder={'A | Living Room\nB | Dining Room\nC | Kitchen\nD | Guest Bedroom\nE | Master Bedroom'} style={{...inputStyle,minHeight:180,resize:"vertical",fontFamily:FONT_BODY}}/>
            </Field>
          </div>
          {parseBulkPreview().length>0&&<div style={{marginTop:12,border:`1px solid ${T.line}`,background:"#fff"}}>
            <div style={{padding:"9px 10px",background:T.paper2,fontFamily:FONT_MONO,fontSize:10,fontWeight:700}}>PREVIEW — exactly what will be saved</div>
            <div style={{display:"grid",gridTemplateColumns:"100px 150px 1fr",fontSize:11,fontWeight:700,borderTop:`1px solid ${T.line}`}}><div style={{padding:8}}>Zone Code</div><div style={{padding:8}}>Floor</div><div style={{padding:8}}>Area / Room</div></div>
            {parseBulkPreview().map((r,i)=><div key={r.lineIndex} style={{display:"grid",gridTemplateColumns:"100px 150px 1fr",fontSize:12,borderTop:`1px solid ${T.line}`,alignItems:"center"}}>
              <div style={{padding:8,fontFamily:FONT_MONO,fontWeight:700,color:r.valid?T.ink:"#b00020"}}>{r.zoneCode||"MISSING"}</div>
              <div style={{padding:8}}>{r.floor}</div><div style={{padding:8,fontWeight:600}}>{r.area||"MISSING"}</div>
            </div>)}
          </div>}
          <div style={{marginTop:10,padding:10,background:T.paper2,border:`1px solid ${T.line}`,fontFamily:FONT_MONO,fontSize:10,lineHeight:1.6}}>Example:<br/><b>A | Living Room</b><br/><b>B | Dining Room</b><br/><b>Only this format is applicable: Zone Code | Area / Room, one per line.</b><br/><b>Zone Code is entered by the doer; the selected floor is applied automatically.</b></div>
        </div>
        <div style={{padding:14,borderTop:`1px solid ${T.line}`,display:"flex",justifyContent:"flex-end",gap:8}}>
          <button type="button" onClick={()=>setBulkEditor(null)} style={{...smallBtn,background:"#fff"}}>Cancel</button>
          <button type="button" onClick={saveBulk} style={{...smallBtn,background:T.navy,color:"#fff"}}>Save All Areas</button>
        </div>
      </div>
    </div>}
  </div>;
}
const Dot = ({ c }) => <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: c, marginRight: 5 }} />;
const thStyle = { fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.06em", color: "#fff", background: T.navy, padding: "10px 8px", textAlign: "center", whiteSpace: "nowrap" };
const tdStyle = { padding: "9px 8px", textAlign: "center", borderTop: `1px solid ${T.line}`, fontFamily: FONT_BODY, fontSize: 12 };

/* ---------------------------------------------------------------
   VIEW: PROJECT PROFILE — onboarding form + profile browser.
   Mirrors the "Profile" sheet: project no, address, type, dates, and
   a contact per role. Saving a new one adds it straight into the
   project list used everywhere else (Floor/Zone, Upload, Timesheet),
   and its contacts flow into the auto-built Directory below.
--------------------------------------------------------------- */
function emptyDraft() {
  return { no: "", name: "", address: "", type: "Residence", startDate: "", endDate: "", contacts: {} };
}

// Grouped role/contact form used both when onboarding a new project and
// when editing an existing one's contacts — categories match the sheet's
// own Owner / Design / Construction sections.
function ContactFields({ contacts, onChange, teamMaster = [] }) {
  const activeMembers = (teamMaster || []).filter(m => m.active !== false && String(m.active).toLowerCase() !== "false");
  const membersForRole = (role) => activeMembers.filter(m => (m.role || "").trim().toLowerCase() === role.trim().toLowerCase());
  const selectMember = (role, userId) => {
    const member = activeMembers.find(m => m.userId === userId);
    if (!member) {
      onChange(role, "name", "");
      onChange(role, "email", "");
      onChange(role, "mobile", "");
      onChange(role, "teamUserId", "");
      return;
    }
    onChange(role, "teamUserId", member.userId);
    onChange(role, "name", member.name || "");
    onChange(role, "email", member.email || "");
    onChange(role, "mobile", member.mobile || "");
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxHeight: 500, overflowY: "auto", paddingRight: 4 }}>
      {ROLE_CATEGORIES.map(({ category, roles }) => (
        <div key={category}>
          <div style={{
            display: "inline-block", fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.08em",
            textTransform: "uppercase", color: categoryColor(category), background: `${categoryColor(category)}18`,
            padding: "3px 9px", borderRadius: 4, marginBottom: 8,
          }}>{category}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {roles.map((role) => {
              const roleChoices = membersForRole(role);
              const isDesignRole = category === "Design";
              // Every Design contact is selected from Team Master. Prefer matching-role
              // employees first, but keep all active employees available so a project can
              // assign a person even while their master designation is being updated.
              const choices = isDesignRole
                ? [...roleChoices, ...activeMembers.filter(m => !roleChoices.some(r => r.userId === m.userId))]
                : roleChoices;
              const current = contacts[role] || {};
              const matched = activeMembers.find(m => m.userId === current.teamUserId || (m.name && m.name === current.name));
              return (
                <div key={role} style={{ display: "grid", gridTemplateColumns: "170px 1fr 1fr 1fr", gap: 8, alignItems: "center" }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: T.inkDim }}>{role}</div>
                  {(isDesignRole || choices.length) ? (
                    <select
                      style={{ ...inputStyle, padding: "7px 10px", fontSize: 12.5 }}
                      value={matched?.userId || ""}
                      onChange={(e) => selectMember(role, e.target.value)}
                    >
                      <option value="">Select from Team Master</option>
                      {choices.map(m => <option key={m.userId} value={m.userId}>{m.name}{isDesignRole && m.role ? ` — ${m.role}` : ""}</option>)}
                    </select>
                  ) : (
                    <input style={{ ...inputStyle, padding: "7px 10px", fontSize: 12.5 }} placeholder="Name" value={current.name || ""} onChange={(e) => onChange(role, "name", e.target.value)} />
                  )}
                  <input style={{ ...inputStyle, padding: "7px 10px", fontSize: 12.5, background:isDesignRole?"#f4f2eb":"#fff" }} placeholder="Email" value={current.email || ""} readOnly={isDesignRole} onChange={(e) => !isDesignRole && onChange(role, "email", e.target.value)} />
                  <input style={{ ...inputStyle, padding: "7px 10px", fontSize: 12.5, background:isDesignRole?"#f4f2eb":"#fff" }} placeholder="Mobile" value={current.mobile || ""} readOnly={isDesignRole} onChange={(e) => !isDesignRole && onChange(role, "mobile", e.target.value)} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const PROJECT_STATUSES = ["Ongoing", "On Hold", "Completed"];
const statusColor = (s) => s === "Completed" ? { bg: T.greenBg, fg: T.green } : s === "On Hold" ? { bg: T.redlineBg, fg: T.redline } : { bg: "#DDE7F5", fg: T.blue };

const PROJECT_TABS = [
  { id: "onboarding", label: "Onboarding", icon: Building2 },
  { id: "scope", label: "Project Info & Scope", icon: LayoutGrid },
  { id: "team", label: "Team & Ratings", icon: Users },
  { id: "line", label: "Line of Work", icon: Settings2 },
];

const emptyScopeRow = () => ({ id: uid(), area: "", scope: "", deliverable: "", notes: "" });
const emptyWorkRow = () => ({ id: uid(), sequence: 1, title: "", time: "", hours: 0, plannedCompletionDate: "", visits: 0, assignee: "" });

function projectScopeDefaults(project) {
  return project.scope || {
    client: "", brief: "", targetDate: "", rows: [], exclusions: "", notes: ""
  };
}

function lineOfWorkDefaults(project, people) {
  return project.lineOfWork || [
    { ...emptyWorkRow(), sequence: 1, title: "Concept / Design", assignee: people[0] || "" },
    { ...emptyWorkRow(), sequence: 2, title: "Lighting Layout", assignee: people[0] || "" },
    { ...emptyWorkRow(), sequence: 3, title: "Coordination / Working Drawing", assignee: people[1] || people[0] || "" },
    { ...emptyWorkRow(), sequence: 4, title: "Review / Issue", assignee: people[0] || "" },
  ];
}


/* stale ProjectSelector removed cleanly */

function ProjectOnboarding({ state, persist, selectedId, setSelectedId }) {
  const [mode, setMode] = useState("browse");
  const [draft, setDraft] = useState(emptyDraft());
  const [saved, setSaved] = useState(false);

  const saveNew = async () => {
    if (!draft.name.trim()) return;
    const cleanContacts = {};
    Object.entries(draft.contacts).forEach(([role, c]) => {
      if (c && (c.name || "").trim()) cleanContacts[role] = { name: c.name.trim(), email: (c.email || "").trim(), mobile: String(c.mobile ?? "").trim() };
    });
    const ownerName = (cleanContacts.Owner?.name || "").trim();
    const architectName = (cleanContacts.Architect?.name || "").trim();

    const project = {
      id: uid(),
      no: draft.no.trim() || "—",
      name: draft.name.trim(),
      client: ownerName,
      architect: architectName,
      address: draft.address.trim(),
      type: draft.type,
      startDate: draft.startDate,
      endDate: draft.endDate,
      status: "Ongoing",
      contacts: cleanContacts,
      zones: {},
      projectStage: "Onboarding",
      projectStatus: "Ongoing",
      blocker: "",
      delayReason: "",
      plannedCompletionDate: draft.endDate || "",
      scope: {
        client: ownerName,
        architect: architectName,
        brief: "",
        targetDate: draft.endDate || "",
        rows: [],
        exclusions: "",
        notes: ""
      },
      lineOfWork: []
    };
    let created = project;
    try {
      const row = await projectApi.create(frontendProjectToBackend(project, false));
      created = backendProjectToFrontend(row, project);
      if (Object.keys(cleanContacts).length) {
        await projectApi.saveContacts(created.id, contactsObjectToRows(created, cleanContacts));
        created = {...created, contacts: cleanContacts};
      }
    } catch (err) {
      alert(`Google Sheets save failed: ${err?.message || err}`);
      return;
    }
    await persist({ ...state, projects: [...state.projects, created] });
    setDraft(emptyDraft()); setSelectedId(created.id); setMode("browse"); setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };

  const updateProject = async (projectId, patch) => {
    const current = state.projects.find(p => p.id === projectId);
    if (!current) return;
    const nextProject = { ...current, ...patch, status: patch.projectStatus || current.status };
    let updatedRow;
    try { updatedRow = await projectApi.update(frontendProjectToBackend(nextProject, true)); }
    catch (err) { alert(`Google Sheets update failed: ${err?.message || err}`); return; }
    const syncedProject = backendProjectToFrontend(updatedRow, nextProject);
    await persist({ ...state, projects: state.projects.map(p => p.id === projectId ? syncedProject : p) });
  };

  const selected = state.projects.find(p => p.id === selectedId) || null;
  const today = new Date().toISOString().slice(0, 10);
  const selectedTasks = selected ? (state.tasks || []).filter(t => t.projectId === selected.id) : [];
  const siteTasks = selectedTasks.filter(t => t.plannedVisits || t.visitBy || /site|visit|review|briefing|wiring|ceiling|flooring|elevation/i.test(`${t.title || ""} ${t.drawingType || ""}`));
  const activeSiteTasks = siteTasks.filter(t => t.status === STATUS.IN_PROGRESS || t.status === "In Progress" || t.status === "Started");
  const lineRows = selected?.lineOfWork || [];
  const activeMilestones = lineRows.filter(r => r.milestone && (r.milestoneStatus === "Started" || r.milestoneStatus === "In Progress"));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, margin: 0, color: T.ink }}>Project Onboarding</h2>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.inkDim, marginTop: 4 }}>Select a project to see its current stage, status, schedule and site activity.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Chip active={mode === "browse"} onClick={() => setMode("browse")}>Existing Projects</Chip>
          <Chip active={mode === "new"} onClick={() => setMode("new")}>+ New Onboarding</Chip>
        </div>
      </div>
      {saved && <div style={{ marginBottom: 14, fontFamily: FONT_MONO, fontSize: 12, color: T.green }}>Project onboarded successfully.</div>}

      {mode === "new" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 32 }}>
          <div>
            <Field label="Project no."><input style={inputStyle} value={draft.no} onChange={(e) => setDraft({ ...draft, no: e.target.value })} placeholder="e.g. 058" /></Field>
            <Field label="Project name"><input style={inputStyle} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Sector 12, Gurugram" /></Field>
            <Field label="Address"><input style={inputStyle} value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /></Field>
            <Field label="Project type"><select style={inputStyle} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}><option>Residence</option><option>Commercial</option><option>Hospitality</option><option>Retail</option></select></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Start date"><input type="date" style={inputStyle} value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} /></Field>
              <Field label="Target completion"><input type="date" style={inputStyle} value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} /></Field>
            </div>
            <Btn onClick={saveNew} disabled={!draft.name.trim()}><ClipboardCheck size={14} /> Create project</Btn>
          </div>
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: T.inkDim, marginBottom: 10 }}>Initial team / contacts</div>
            <ContactFields contacts={draft.contacts} teamMaster={state.teamMaster || []} onChange={(role, field, value) => setDraft(d => ({ ...d, contacts: { ...d.contacts, [role]: { ...(d.contacts[role] || {}), [field]: value } } }))} />
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
            {state.projects.map((p) => {
              const stage = p.projectStage || "Onboarding";
              const status = p.projectStatus || p.status || "Ongoing";
              const isSelected = p.id === selectedId;
              return (
                <button key={p.id} onClick={() => setSelectedId(p.id)} style={{ textAlign: "left", background: isSelected ? T.navy : "#fff", color: isSelected ? "#fff" : T.ink, border: `1px solid ${isSelected ? T.navy : T.line}`, borderRadius: 0, padding: "14px 16px", cursor: "pointer", display: "grid", gridTemplateColumns: "70px 1fr auto", gap: 14, alignItems: "center" }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: isSelected ? T.cyan : T.inkDim }}>{p.no}</span>
                  <span><strong style={{ fontFamily: FONT_DISPLAY }}>{p.name}</strong><span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 11, opacity: 0.72, marginTop: 3 }}>{p.address}</span></span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, textAlign:"right" }}><b>{stage}</b></span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {mode === "browse" && selected && (() => {
        const stage = selected.projectStage || "Onboarding";
        const status = selected.projectStatus || selected.status || "Ongoing";
        const planned = selected.plannedCompletionDate || selected.endDate || "";
        const delayed = planned && status !== "Completed" && new Date(planned + "T23:59:59") < new Date();
        const statusStyles = status === "Completed" ? {background:T.greenBg,color:T.green} : status === "On Hold" ? {background:T.redlineBg,color:T.redline} : {background:"#DDE7F5",color:T.blue};
        const save = (patch) => updateProject(selected.id, patch);
        return <div style={{ marginTop: 22 }}>
          {/* Project list carries the stage; status is intentionally only the compact control at right. */}
          <div style={{ borderTop:`2px solid ${T.ink}`, borderBottom:`1px solid ${T.line}`, padding:"14px 0" }}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16}}>
              <div>
                <div style={{fontFamily:FONT_MONO,fontSize:10,letterSpacing:".1em",textTransform:"uppercase",color:T.inkDim}}>Selected Project</div>
                <div style={{fontFamily:FONT_DISPLAY,fontSize:19,marginTop:4}}>{selected.name}</div>
                <div style={{fontFamily:FONT_MONO,fontSize:11,color:T.inkDim,marginTop:3}}>Current Stage · <b style={{color:T.ink}}>{stage}</b></div>
              </div>
              <select aria-label="Project status" value={status} onChange={e=>save({projectStatus:e.target.value})} style={{border:"1px solid #9FA7B1",borderRadius:0,padding:"8px 11px",fontFamily:FONT_MONO,fontSize:11,fontWeight:700,cursor:"pointer",...statusStyles}}>
                <option>Ongoing</option><option>On Hold</option><option>Completed</option>
              </select>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1.4fr",gap:18,marginTop:16}}>
              <Field label="Current stage"><select style={{...inputStyle,borderRadius:0}} value={stage} onChange={e=>save({projectStage:e.target.value})}>{["Onboarding","Concept","Design Development","Working Drawings","Client Review","Execution","Snagging","Completed"].map(x=><option key={x}>{x}</option>)}</select></Field>
              <Field label="Project starting date"><input type="date" style={{...inputStyle,borderRadius:0}} value={selected.startDate || ""} onChange={e=>save({startDate:e.target.value})}/></Field>
              <Field label="Planned completion date"><input type="date" style={{...inputStyle,borderRadius:0}} value={planned} onChange={e=>save({plannedCompletionDate:e.target.value,endDate:e.target.value})}/></Field>
            </div>
            <div style={{marginTop:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
              <Field label="What is stopping / taking longer?"><input style={{...inputStyle,borderRadius:0}} value={selected.blocker || selected.delayReason || ""} placeholder="Record blocker or reason for delay" onChange={e=>save({blocker:e.target.value,delayReason:e.target.value})}/></Field>
              <div style={{fontFamily:FONT_MONO,fontSize:11,color:T.inkDim,display:"flex",alignItems:"end",paddingBottom:8}}>{delayed ? <span style={{fontWeight:700,color:T.redline}}>DELAYED — planned date has passed</span> : <span>SCHEDULE · ON TRACK</span>}</div>
            </div>
          </div>

          <div style={{marginTop:22}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",borderBottom:`1px solid ${T.ink}`,paddingBottom:8}}>
              <div><div style={{fontFamily:FONT_MONO,fontSize:10,letterSpacing:".1em",textTransform:"uppercase",color:T.cyan}}>Site activity</div><h3 style={{fontFamily:FONT_DISPLAY,fontSize:17,margin:"4px 0 0"}}>What is going on site right now</h3></div>
              <span style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim}}>{activeSiteTasks.length + activeMilestones.length} active items</span>
            </div>
            {(activeSiteTasks.length || activeMilestones.length) ? <div style={{marginTop:0,borderLeft:`1px solid ${T.line}`,borderRight:`1px solid ${T.line}`}}>
              {[...activeMilestones.map(r=>({key:`m-${r.id}`,title:r.milestone,detail:`${r.floor || "Floor not set"} · ${r.tasks || "Milestone"}`,person:r.milestoneUpdatedBy || r.responsible || "—"})), ...activeSiteTasks.map(t=>({key:`t-${t.id}`,title:t.title || t.drawingType,detail:`${t.visitBy || "Site task"}`,person:t.assignee || "—"}))].map(item=><div key={item.key} style={{display:"grid",gridTemplateColumns:"1fr 1fr 150px",gap:12,padding:"10px 12px",borderBottom:`1px solid ${T.line}`,fontSize:12}}><div style={{fontWeight:700}}>{item.title}</div><div style={{color:T.inkDim}}>{item.detail}</div><div style={{fontFamily:FONT_MONO,fontSize:10}}>{item.person}</div></div>)}
            </div> : <div style={{padding:"14px 0",fontFamily:FONT_BODY,fontSize:12.5,color:T.inkDim}}>No site activity is currently marked as in progress. Site activity will appear here when a milestone or visit task is started in Line of Work.</div>}
          </div>
        </div>;
      })()}
    </div>
  );
}

function ProjectScopeView({ state, persist, selectedId }) {
  const project = state.projects.find(p => p.id === selectedId) || state.projects[0];
  const allRows = state.scopeSheet || PROJECT_SCOPE_SHEET_ROWS;
  const [row, setRow] = useState(null);
  useEffect(() => {
    if (!project) return;
    const found = allRows.find(r => (r.project || "").trim().toLowerCase() === (project.name || "").trim().toLowerCase());
    setRow(found ? {...found} : {serial:"",project:project.name,client:"",architect:"",basement:false,stilt_floor:false,gf:false,"1f":false,"2f":false,"3f":false,terrace:false,facade:false,wall_elevation:false,landscape:false,bath_elevation:false,wardrobe:false,kitchen:false,onboarding:false});
  }, [project?.id, state.scopeSheet]);
  if (!project || !row) return null;
  const boolFields = [["basement","Basement"],["stilt_floor","Stilt Floor"],["gf","GF"],["1f","1F"],["2f","2F"],["3f","3F"],["terrace","Terrace"],["facade","Facade"],["wall_elevation","Wall Elevation"],["landscape","Landscape"],["bath_elevation","Bath Elevation"],["wardrobe","Wardrobe"],["kitchen","Kitchen"],["onboarding","Onboarding"]];
  const update = (patch) => setRow(r => ({...r,...patch}));
  const save = async () => {
    const next = allRows.some(r => (r.project||"").trim().toLowerCase() === (project.name||"").trim().toLowerCase())
      ? allRows.map(r => (r.project||"").trim().toLowerCase() === (project.name||"").trim().toLowerCase() ? row : r)
      : [...allRows,row];
    await persist({...state, scopeSheet: next, projects: state.projects.map(p=>p.id===project.id ? {...p, scope:row} : p)});
  };
  return <div>
    <div style={{marginBottom:18}}><h2 style={{fontFamily:FONT_DISPLAY,fontSize:20,margin:0,color:T.ink}}>Project Info & Scope</h2><div style={{fontFamily:FONT_BODY,fontSize:13,color:T.inkDim,marginTop:5}}>Scope register for the selected project only.</div></div>
    <div style={{borderTop:`2px solid ${T.ink}`,borderBottom:`1px solid ${T.line}`,padding:"14px 0",marginBottom:16}}>
      <div style={{display:"grid",gridTemplateColumns:"90px 1.6fr 1fr 1fr",gap:16}}>
        <Field label="S. No"><input style={{...inputStyle,borderRadius:0}} value={row.serial||""} onChange={e=>update({serial:e.target.value})}/></Field>
        <Field label="Current Project"><input style={{...inputStyle,borderRadius:0}} value={row.project||""} onChange={e=>update({project:e.target.value})}/></Field>
        <Field label="Client"><input style={{...inputStyle,borderRadius:0}} value={row.client||""} onChange={e=>update({client:e.target.value})}/></Field>
        <Field label="Architect"><input style={{...inputStyle,borderRadius:0}} value={row.architect||""} onChange={e=>update({architect:e.target.value})}/></Field>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",borderTop:`1px solid ${T.line}`,borderLeft:`1px solid ${T.line}`}}>
      {boolFields.map(([key,label])=><label key={key} style={{display:"flex",alignItems:"center",gap:10,minHeight:52,padding:"10px 12px",borderRight:`1px solid ${T.line}`,borderBottom:`1px solid ${T.line}`,cursor:"pointer",background:row[key]?"#F0F3EF":"#fff"}}><input type="checkbox" checked={!!row[key]} onChange={e=>update({[key]:e.target.checked})} style={{width:18,height:18,accentColor:T.navy}}/><span style={{fontFamily:FONT_BODY,fontSize:13}}>{label}</span></label>)}
    </div>
    <div style={{marginTop:16}}><Btn onClick={save}><ClipboardCheck size={14}/> Save Project Scope</Btn></div>
  </div>;
}

function ProjectTeamView({ state, persist, selectedId }) {
  const [editingId,setEditingId]=useState("");
  const [draft,setDraft]=useState({});
  const [saving,setSaving]=useState(false);
  const seen=new Set();
  const projects=(state.projects||[]).filter(p=>{
    if(p.completed)return false;
    const k=String(p.id||p.no||p.name||"").trim().toLowerCase();
    if(!k||seen.has(k))return false; seen.add(k); return true;
  });
  const project=projects.find(p=>String(p.id)===String(editingId));

  const openEditor=(p)=>{
    const c={...(p.contacts||{})};
    if(!c.Owner?.name&&p.client)c.Owner={...(c.Owner||{}),name:p.client};
    if(!c.Architect?.name&&p.architect)c.Architect={...(c.Architect||{}),name:p.architect};
    setDraft(c);
    setEditingId(String(p.id));
    projectApi.listContacts(p.id).then(rows=>{
      const sheet=contactRowsToObject(rows||[]);
      if(Object.keys(sheet).length)setDraft(current=>({...current,...sheet}));
    }).catch(err=>console.warn("ProjectContacts background load failed",err));
  };

  const closeEditor=()=>{if(!saving){setEditingId("");setDraft({});}};
  const setField=(role,field,value)=>setDraft(d=>({...d,[role]:{...(d[role]||{}),[field]:value}}));

  const save=async()=>{
    if(!project||saving)return;
    const clean={};
    Object.entries(draft||{}).forEach(([role,c])=>{
      if((c?.name||"").trim())clean[role]={
        name:(c.name||"").trim(),email:(c.email||"").trim(),mobile:String(c.mobile ?? "").trim(),
        company:(c.company||"").trim(),rating:c.rating||""
      };
    });
    setSaving(true);
    try{
      await projectApi.saveContacts(project.id,contactsObjectToRows(project,clean));
      const next={...project,contacts:clean,client:clean.Owner?.name||project.client||"",architect:clean.Architect?.name||project.architect||""};
      try{await projectApi.update(frontendProjectToBackend(next,true));}catch(e){console.warn("Project client/architect sync failed",e);}
      await persist({...state,projects:(state.projects||[]).map(p=>p.id===project.id?next:p)});
      setEditingId(""); setDraft({});
    }catch(err){alert(`Google Sheets contact save failed: ${err?.message||err}`);}
    finally{setSaving(false);}
  };

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div><h2 style={{fontFamily:FONT_DISPLAY,margin:"0 0 4px"}}>Team & Ratings</h2>
      <div style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim}}>Project-wise team master. Click EDIT to open that project's contacts.</div></div>
    </div>
    <div style={{border:`1px solid ${T.line}`,background:"#fff",overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontFamily:FONT_BODY,fontSize:12}}>
        <thead><tr style={{background:T.paper2}}>{["S. No","Project No.","Project","Client / Owner","Architect","Action"].map(h=><th key={h} style={{textAlign:"left",padding:"10px 12px",borderBottom:`1px solid ${T.line}`}}>{h}</th>)}</tr></thead>
        <tbody>{projects.map((p,i)=><tr key={p.id||`${p.no}-${i}`}>
          <td style={{padding:10,borderBottom:`1px solid ${T.line}`}}>{i+1}</td>
          <td style={{padding:10,borderBottom:`1px solid ${T.line}`,fontFamily:FONT_MONO}}>{p.no||"—"}</td>
          <td style={{padding:10,borderBottom:`1px solid ${T.line}`,fontWeight:600}}>{p.name}</td>
          <td style={{padding:10,borderBottom:`1px solid ${T.line}`}}>{p.contacts?.Owner?.name||p.client||"—"}</td>
          <td style={{padding:10,borderBottom:`1px solid ${T.line}`}}>{p.contacts?.Architect?.name||p.architect||"—"}</td>
          <td style={{padding:10,borderBottom:`1px solid ${T.line}`}}><button type="button" onClick={()=>openEditor(p)} style={{...smallBtn,background:"#fff",cursor:"pointer"}}>EDIT</button></td>
        </tr>)}</tbody>
      </table>
    </div>

    {project&&<div onMouseDown={e=>{if(e.target===e.currentTarget)closeEditor();}} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(8,25,45,.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"min(1180px,96vw)",maxHeight:"90vh",overflowY:"auto",background:T.paper,border:`1px solid ${T.line}`,boxShadow:"0 20px 60px rgba(0,0,0,.28)"}}>
        <div style={{position:"sticky",top:0,zIndex:2,background:T.navy,color:"#fff",padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div><div style={{fontFamily:FONT_MONO,fontSize:10,opacity:.7}}>EDIT PROJECT TEAM</div><div style={{fontFamily:FONT_DISPLAY,fontSize:18}}>{project.no} · {project.name}</div></div>
          <button type="button" onClick={closeEditor} style={{...smallBtn,background:"#fff",cursor:"pointer"}}>CLOSE</button>
        </div>
        <div style={{padding:18}}>
          {ROLE_CATEGORIES.map(group=><div key={group.category} style={{marginBottom:18}}>
            <div style={{fontFamily:FONT_MONO,fontSize:10,letterSpacing:".08em",textTransform:"uppercase",color:T.cyan,borderBottom:`1px solid ${T.line}`,paddingBottom:6,marginBottom:8}}>{group.category}</div>
            {group.roles.map(role=><div key={role} style={{display:"grid",gridTemplateColumns:"190px 1fr 1fr 1fr",gap:10,alignItems:"center",marginBottom:8}}>
              <div style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim}}>{role}</div>
              <input value={draft[role]?.name||""} onChange={e=>setField(role,"name",e.target.value)} placeholder="Name" style={inputStyle}/>
              <input value={draft[role]?.email||""} onChange={e=>setField(role,"email",e.target.value)} placeholder="Email" style={inputStyle}/>
              <input value={draft[role]?.mobile||""} onChange={e=>setField(role,"mobile",e.target.value)} placeholder="Mobile" style={inputStyle}/>
            </div>)}
          </div>)}
          <div style={{display:"flex",gap:10,position:"sticky",bottom:0,background:T.paper,padding:"12px 0 4px",borderTop:`1px solid ${T.line}`}}>
            <button type="button" disabled={saving} onClick={save} style={{...smallBtn,background:T.navy,color:"#fff",cursor:saving?"wait":"pointer",padding:"9px 16px"}}>{saving?"Saving…":"Save Contacts"}</button>
            <button type="button" disabled={saving} onClick={closeEditor} style={{...smallBtn,background:"#fff",cursor:"pointer",padding:"9px 16px"}}>Cancel</button>
          </div>
        </div>
      </div>
    </div>}
  </div>;
}

function residenceLineOfWorkDefaults(project, people) {
  const existing = (project?.lineOfWorkResidence?.length ? project.lineOfWorkResidence : project?.lineOfWork);
  if (existing && existing.length) return existing.map((r,i) => ({
    ...r, id:r.id||uid(), sourceRow:r.sourceRow||i+1,
    drawings:r.drawings||r.title||r.drawing||r.work||"",
    tasks:r.tasks||r.task||"",
    time:r.time||"",
    hours:r.hours??r.plannedHours??"",
    plannedStart:r.plannedStart||r.plannedStartDate||"",
    plannedCompletion:r.plannedCompletion||r.plannedCompletionDate||"",
    responsible:r.responsible||r.responsiblePerson||r.assignee||people[0]||"",
    status:r.status||r.taskStatus||"Not Started",
    milestone:r.milestone||"", floor:r.floor||r.floorZone||r.zone||"",
    visits:r.visits||"", visitBy:r.visitBy||""
  }));
  return lineOfWorkDefaults(project || {}, people || []).map((r,i) => ({
    ...r, id:r.id||uid(), sourceRow:i+1,
    drawings:r.drawings||r.title||r.drawing||r.work||"", tasks:r.tasks||r.task||"",
    time:r.time||"",
    hours:r.hours??r.plannedHours??"",
    plannedStart:r.plannedStart||r.plannedStartDate||"",
    plannedCompletion:r.plannedCompletion||r.plannedCompletionDate||"",
    responsible:r.responsible||r.responsiblePerson||r.assignee||people?.[0]||"",
    status:r.status||r.taskStatus||"Not Started",
    milestone:r.milestone||"", floor:r.floor||r.floorZone||r.zone||"",
    visits:r.visits||"", visitBy:r.visitBy||""
  }));
}

function splitDesignExecutionRows(project, people){
  const all = residenceLineOfWorkDefaults(project, people || []).map((r,i)=>({
    ...r,
    id:r.id||uid(),
    sequence:r.sequence||i+1,
    milestoneStatus:r.milestoneStatus||"Not Started"
  }));
  const firstMilestone = all.findIndex(r=>String(r.milestone||"").trim());
  if(firstMilestone < 0) return {design:all, execution:[]};
  return {design:all.slice(0,firstMilestone), execution:all.slice(firstMilestone)};
}

function ProjectLineOfWorkView({ state, persist, selectedId }) {
  const [editingId,setEditingId]=useState("");
  const [rows,setRows]=useState([]);
  const [saving,setSaving]=useState(false);
  const seen=new Set();
  const projects=(state.projects||[]).filter(p=>{
    if(p.completed)return false;
    const k=String(p.id||p.no||p.name||"").trim().toLowerCase();
    if(!k||seen.has(k))return false;
    seen.add(k); return true;
  });
  const project=projects.find(p=>String(p.id)===String(editingId));

  const peopleFor=(p)=>{
    const names=[];
    Object.values(p?.contacts||{}).forEach(c=>{if(c?.name&&!names.includes(c.name))names.push(c.name);});
    (state.team||[]).forEach(x=>{const n=x?.name||x;if(n&&!names.includes(n))names.push(n);});
    return names.length?names:[""];
  };

  const openEditor=(p)=>{
    const people=peopleFor(p);
    const all=residenceLineOfWorkDefaults(p,people);
    const split=splitDesignExecutionRows({...p,lineOfWorkResidence:all},people);
    setRows((split.design||[]).map(r=>({...r})));
    setEditingId(String(p.id));
    projectApi.listLineOfWork(p.id).then(sheetRows=>{
      if(!Array.isArray(sheetRows)||!sheetRows.length)return;
      const normalized=sheetRows.map(r=>({...r,id:r.lineWorkId||r.id}));
      const fresh=splitDesignExecutionRows({...p,lineOfWorkResidence:normalized},people);
      setRows((fresh.design||[]).map(r=>({...r})));
    }).catch(err=>console.warn("LineOfWork background load failed",err));
  };
  const closeEditor=()=>{if(!saving){setEditingId("");setRows([]);}};
  const updateRow=(id,key,value)=>setRows(rs=>rs.map(r=>r.id===id?{...r,[key]:value}:r));
  const addRow=()=>setRows(rs=>[...rs,{id:uid(),sourceRow:rs.length+1,drawings:"",tasks:"",time:"",hours:"",plannedStart:"",plannedCompletion:"",responsible:"",status:"Not Started",milestone:"",floor:"",visits:"",visitBy:""}]);
  const removeRow=id=>setRows(rs=>rs.filter(r=>r.id!==id));

  const save=async()=>{
    if(!project||saving)return;
    setSaving(true);
    try{
      const people=peopleFor(project);
      const existingAll=residenceLineOfWorkDefaults(project,people);
      const existingSplit=splitDesignExecutionRows({...project,lineOfWorkResidence:existingAll},people);
      const design=rows.map((r,i)=>({...r,sourceRow:i+1,milestone:""}));
      const merged=[...design,...(existingSplit.execution||[])];
      const savedRows=await projectApi.saveLineOfWork(project.id,merged);
      const normalized=(savedRows||merged).map(r=>({...r,id:r.lineWorkId||r.id}));
      const next={...project,lineOfWorkResidence:normalized,lineOfWork:normalized};
      await persist({...state,projects:(state.projects||[]).map(p=>p.id===project.id?next:p)});
      setEditingId(""); setRows([]);
    }catch(err){alert(`Couldn't save Line of Work: ${err?.message||err}`);}
    finally{setSaving(false);}
  };

  const hasSaved=p=>{
    const all=p?.lineOfWorkResidence||p?.lineOfWork||[];
    return Array.isArray(all)&&all.some(r=>(r.drawings||r.title||r.drawing||r.work||r.tasks||r.task||r.plannedStart||r.plannedStartDate||r.plannedCompletion||r.plannedCompletionDate));
  };
  const taskCounts=p=>{
    const people=peopleFor(p);
    const design=splitDesignExecutionRows(p,people).design||[];
    const taskRows=design.filter(r=>String(r.tasks||r.task||r.drawings||r.title||r.drawing||r.work||"").trim());
    const completed=taskRows.filter(r=>{
      const s=String(r.status||r.taskStatus||"").trim().toLowerCase();
      return s==="completed"||s==="complete"||r.completed===true;
    }).length;
    return {open:Math.max(0,taskRows.length-completed),completed};
  };

  return <div>
    <div style={{marginBottom:16}}>
      <div style={{fontFamily:FONT_MONO,fontSize:10,letterSpacing:".08em",color:T.cyan}}>PROJECT-WISE · DESIGN SEQUENCE</div>
      <h2 style={{fontFamily:FONT_DISPLAY,margin:"5px 0 4px"}}>Line of Work</h2>
      <div style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim}}>Enter and update Line of Work separately for each project.</div>
    </div>
    <div style={{border:`1px solid ${T.line}`,background:"#fff",overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontFamily:FONT_BODY,fontSize:12}}>
        <thead><tr style={{background:T.paper2}}>{["S. No","Project No.","Project","Client","Architect","Line of Work","Open Tasks","Completed Tasks","Action"].map(h=><th key={h} style={{textAlign:"left",padding:"10px 12px",borderBottom:`1px solid ${T.line}`}}>{h}</th>)}</tr></thead>
        <tbody>{projects.map((p,i)=><tr key={p.id||`${p.no}-${i}`}>
          <td style={{padding:10,borderBottom:`1px solid ${T.line}`}}>{i+1}</td>
          <td style={{padding:10,borderBottom:`1px solid ${T.line}`,fontFamily:FONT_MONO}}>{p.no||"—"}</td>
          <td style={{padding:10,borderBottom:`1px solid ${T.line}`,fontWeight:600}}>{p.name}</td>
          <td style={{padding:10,borderBottom:`1px solid ${T.line}`}}>{p.client||p.contacts?.Owner?.name||"—"}</td>
          <td style={{padding:10,borderBottom:`1px solid ${T.line}`}}>{p.architect||p.contacts?.Architect?.name||"—"}</td>
          <td style={{padding:10,borderBottom:`1px solid ${T.line}`}}>{hasSaved(p)?"Entered":"Not Entered"}</td>
          <td style={{padding:10,borderBottom:`1px solid ${T.line}`,textAlign:"center",fontWeight:700}}>{taskCounts(p).open}</td>
          <td style={{padding:10,borderBottom:`1px solid ${T.line}`,textAlign:"center",fontWeight:700}}>{taskCounts(p).completed}</td>
          <td style={{padding:10,borderBottom:`1px solid ${T.line}`}}><button type="button" onClick={()=>openEditor(p)} style={{...smallBtn,background:"#fff",cursor:"pointer"}}>EDIT</button></td>
        </tr>)}</tbody>
      </table>
    </div>

    {project&&<div onMouseDown={e=>{if(e.target===e.currentTarget)closeEditor();}} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(8,25,45,.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"min(1500px,98vw)",maxHeight:"92vh",overflow:"auto",background:T.paper,border:`1px solid ${T.line}`,boxShadow:"0 20px 60px rgba(0,0,0,.28)"}}>
        <div style={{position:"sticky",top:0,zIndex:3,background:T.navy,color:"#fff",padding:"13px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontFamily:FONT_MONO,fontSize:10,opacity:.7}}>EDIT LINE OF WORK</div><div style={{fontFamily:FONT_DISPLAY,fontSize:18}}>{project.no} · {project.name}</div></div>
          <button type="button" onClick={closeEditor} style={{...smallBtn,background:"#fff",cursor:"pointer"}}>CLOSE</button>
        </div>
        <div style={{padding:16}}>
          <div style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim,marginBottom:12}}>Design/drawing rows only. Milestone-and-after rows remain preserved for Execution Dashboard.</div>
          <div style={{overflowX:"auto",border:`1px solid ${T.line}`,background:"#fff"}}>
            <table style={{width:"1580px",borderCollapse:"collapse",fontFamily:FONT_BODY,fontSize:12}}>
              <thead><tr style={{background:T.paper2}}>{["Line of Work / Drawings","Tasks","Time","Hours","Planned Start Date","Planned Completion Date","Responsible Person","Status",""].map(h=><th key={h} style={{padding:10,borderBottom:`1px solid ${T.line}`,textAlign:"left"}}>{h}</th>)}</tr></thead>
              <tbody>{rows.map(r=><tr key={r.id}>
                <td style={{padding:8,borderBottom:`1px solid ${T.line}`}}><input value={r.drawings||""} onChange={e=>updateRow(r.id,"drawings",e.target.value)} style={inputStyle}/></td>
                <td style={{padding:8,borderBottom:`1px solid ${T.line}`}}><textarea value={r.tasks||""} onChange={e=>updateRow(r.id,"tasks",e.target.value)} style={{...inputStyle,minHeight:52,resize:"vertical"}}/></td>
                <td style={{padding:8,borderBottom:`1px solid ${T.line}`}}><input type="time" value={r.time||""} onChange={e=>updateRow(r.id,"time",e.target.value)} style={inputStyle}/></td>
                <td style={{padding:8,borderBottom:`1px solid ${T.line}`}}><input type="number" min="0" step="0.25" value={r.hours??""} onChange={e=>updateRow(r.id,"hours",e.target.value)} style={inputStyle}/></td>
                <td style={{padding:8,borderBottom:`1px solid ${T.line}`}}><input type="date" value={r.plannedStart||""} onChange={e=>updateRow(r.id,"plannedStart",e.target.value)} style={inputStyle}/></td>
                <td style={{padding:8,borderBottom:`1px solid ${T.line}`}}><input type="date" value={r.plannedCompletion||""} onChange={e=>updateRow(r.id,"plannedCompletion",e.target.value)} style={inputStyle}/></td>
                <td style={{padding:8,borderBottom:`1px solid ${T.line}`}}><select value={r.responsible||""} onChange={e=>updateRow(r.id,"responsible",e.target.value)} style={inputStyle}><option value="">Select</option>{peopleFor(project).filter(Boolean).map(n=><option key={n} value={n}>{n}</option>)}</select></td>
                <td style={{padding:8,borderBottom:`1px solid ${T.line}`}}><select value={r.status||"Not Started"} onChange={e=>updateRow(r.id,"status",e.target.value)} style={inputStyle}><option>Not Started</option><option>In Progress</option><option>Completed</option></select></td>
                <td style={{padding:8,borderBottom:`1px solid ${T.line}`}}><button type="button" onClick={()=>removeRow(r.id)} style={{...smallBtn,background:"#fff",cursor:"pointer"}}>Remove</button></td>
              </tr>)}</tbody>
            </table>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",gap:10,position:"sticky",bottom:0,background:T.paper,padding:"12px 0 2px",borderTop:`1px solid ${T.line}`,marginTop:12}}>
            <button type="button" onClick={addRow} style={{...smallBtn,background:"#fff",cursor:"pointer",padding:"9px 15px"}}>+ Add Row</button>
            <div style={{display:"flex",gap:10}}>
              <button type="button" disabled={saving} onClick={save} style={{...smallBtn,background:T.navy,color:"#fff",cursor:saving?"wait":"pointer",padding:"9px 16px"}}>{saving?"Saving…":"Save Line of Work"}</button>
              <button type="button" disabled={saving} onClick={closeEditor} style={{...smallBtn,background:"#fff",cursor:"pointer",padding:"9px 16px"}}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>}
  </div>;
}
function ProjectSelector({ state, selectedId, setSelectedId }) {
  const project = state.projects.find(p => p.id === selectedId) || state.projects[0];
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>
    <div>
      <div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim,letterSpacing:".1em",textTransform:"uppercase",marginBottom:5}}>Selected Project</div>
      <select value={project?.id || ""} onChange={e=>setSelectedId(e.target.value)} style={{...inputStyle,borderRadius:0,minWidth:320,fontFamily:FONT_DISPLAY,fontSize:16,fontWeight:700}}>
        {state.projects.map(p=><option key={p.id} value={p.id}>{p.no || "—"} · {p.name}</option>)}
      </select>
    </div>
    {project && <div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim}}>Stage: {project.projectControl?.currentStage || project.stage || "Onboarding"} · Status: {project.projectControl?.projectStatus || project.status || "Ongoing"}</div>}
  </div>;
}

function useProjectBoard(state, persist, selectedId) {
  const project = state.projects.find(p => p.id === selectedId) || state.projects[0];
  const [board, setBoard] = useState(null);
  useEffect(() => { setBoard(project?.designExecutionBoard || buildRoomCentricBoard(project)); }, [project?.id]);
  const saveBoard = async (next) => {
    setBoard(next);
    if (!project) return;
    const projects = state.projects.map(p => p.id === project.id ? {...p, designExecutionBoard: next} : p);
    await persist({...state, projects});
  };
  const updateCell = (roomId, key, patch) => {
    const next = {...board, rooms: board.rooms.map(r => r.id === roomId ? {...r, cells:{...r.cells, [key]:{...(r.cells?.[key]||{}), ...patch}}} : r)};
    saveBoard(next);
  };
  return {project, board, saveBoard, updateCell};
}




const DASHBOARD_DRAWING_TYPES = ["Layout","Wall Electrical","False Ceiling","Detail","3D"];
const DASHBOARD_WORK_TYPES = [
  "Concept | 2D | Preliminary Budgeting",
  "3D Renders",
  "Decorative Selection",
  "Wall Electricals Drawings",
  "False Ceiling Drawings",
  "LIGHT Drawings",
  "Slab Electrical Drawings",
  "Facade Elevation Drawings",
  "Bathroom Elevation",
  "Documentation & BOQ",
  "Furniture Drawings"
];
const DASHBOARD_SAMPLE_ZONES = [{"cn": "A", "floor": "GF", "area": "Lobby", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "B", "floor": "GF", "area": "Family Lounge", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "C", "floor": "GF", "area": "Powder RM", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "D", "floor": "GF", "area": "Daughter's Bedroom -2", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "E", "floor": "GF", "area": "Daughter's Bathroom -2", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "Not Started", "Not Started", "N/A"]}, {"cn": "F", "floor": "GF", "area": "Kitchen", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "G", "floor": "GF", "area": "Utility", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "H", "floor": "GF", "area": "Daughter's Bedroom -1", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "I", "floor": "GF", "area": "Daughter's Bathroom -1", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "Not Started", "Not Started", "N/A"]}, {"cn": "J", "floor": "GF", "area": "Sisterinlaw's Bedroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "K", "floor": "GF", "area": "Sisterinlaw's Dresser", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "L", "floor": "GF", "area": "Sisterinlaw's Bathroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "Not Started", "Not Started", "N/A"]}, {"cn": "M", "floor": "GF", "area": "Dinning & Drawing", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "N", "floor": "GF", "area": "Balcony", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "O", "floor": "GF", "area": "Front Balcony", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "P", "floor": "GF", "area": "Back Balcony", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "Q", "floor": "GF", "area": "Staircase", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "R", "floor": "1F", "area": "Lobby & Family Lounge", "received": [false, true, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "021/1F/WE/1", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "S", "floor": "1F", "area": "Drawing Room", "received": [false, true, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "021/1F/WE/2", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "T", "floor": "1F", "area": "Bedroom -02", "received": [false, true, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "021/1F/WE/3", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "U", "floor": "1F", "area": "Washroom", "received": [false, true, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "021/1F/WE/4", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "V", "floor": "1F", "area": "Temple", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "W", "floor": "1F", "area": "Kitchen", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "X", "floor": "1F", "area": "Utility", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "Y", "floor": "1F", "area": "Bedroom -01", "received": [false, true, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "021/1F/WE/8", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "Z", "floor": "1F", "area": "Dress & Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "Not Started", "Not Started", "N/A"]}, {"cn": "AA", "floor": "1F", "area": "Powder Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "Not Started", "Not Started", "N/A"]}, {"cn": "AB", "floor": "1F", "area": "Master Bedroom", "received": [false, true, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "021/1F/WE/11", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "AC", "floor": "1F", "area": "Dresser & Bathroom", "received": [false, true, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "021/1F/WE/12", "Not Started", "Not Started", "N/A", "N/A", "Not Started", "Not Started", "N/A"]}, {"cn": "AD", "floor": "1F", "area": "Back Balcony", "received": [false, true, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "021/1F/WE/13", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "AE", "floor": "1F", "area": "Front Balcony", "received": [false, true, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "021/1F/WE/14", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "Not Started"]}, {"cn": "CN", "floor": "FLR", "area": "AREA", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started"]}, {"cn": "A", "floor": "GF", "area": "Entrance Lobby", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "B", "floor": "GF", "area": "Lift Lobby", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "C", "floor": "GF", "area": "Lobby + Cigar Lounge", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "D", "floor": "GF", "area": "Bar + Dinning Area", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "E", "floor": "GF", "area": "Passage", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "F", "floor": "GF", "area": "Day Room", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "G", "floor": "GF", "area": "Powder RM", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "H", "floor": "GF", "area": "Kitchen", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "I", "floor": "GF", "area": "Washing Area", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "J", "floor": "GF", "area": "Balcony", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "K", "floor": "GF", "area": "Front Courtyard", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "L", "floor": "GF", "area": "Veranda", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "M", "floor": "GF", "area": "Server Room", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "N", "floor": "GF", "area": "Staircase", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "O", "floor": "1F", "area": "Lift Lobby", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "P", "floor": "1F", "area": "Passage", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "Q", "floor": "1F", "area": "Family Lounge", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "R", "floor": "1F", "area": "Master Lounge", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "S", "floor": "1F", "area": "Balcony", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "T", "floor": "1F", "area": "Master Vestibule", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "U", "floor": "1F", "area": "Master Bedroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "V", "floor": "1F", "area": "Toilet & Bathroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "Not Started", "Not Started", "N/A"]}, {"cn": "W", "floor": "1F", "area": "Dresser", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "X", "floor": "1F", "area": "Dresser", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "Y", "floor": "1F", "area": "Kid'd Room", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "Z", "floor": "1F", "area": "Kid'd Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "Not Started", "Not Started", "N/A"]}, {"cn": "AA", "floor": "1F", "area": "Guest Bedroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "AB", "floor": "1F", "area": "Bathroom & Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "Not Started", "Not Started", "N/A"]}, {"cn": "AC", "floor": "2F", "area": "Master Lounge", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "AD", "floor": "2F", "area": "Master Vestibule", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "AE", "floor": "2F", "area": "Master Bedroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "AF", "floor": "2F", "area": "Master Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "Not Started", "Not Started", "N/A"]}, {"cn": "AG", "floor": "2F", "area": "Master Dresser", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "AH", "floor": "2F", "area": "Mandir", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "AI", "floor": "2F", "area": "Balcony", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "AJ", "floor": "2F", "area": "Tarana's Room", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "AK", "floor": "2F", "area": "Bathroom & Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "Not Started", "Not Started", "N/A"]}, {"cn": "AL", "floor": "2F", "area": "Guest Bedroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "AM", "floor": "2F", "area": "Bathroom & Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "Not Started", "Not Started", "N/A"]}, {"cn": "AN", "floor": "2F", "area": "Staff Room", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "AO", "floor": "2F", "area": "Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "Not Started", "Not Started", "N/A"]}, {"cn": "AP", "floor": "2F", "area": "Staircase", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "AQ", "floor": "Facade", "area": "Facade", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "AR", "floor": "Terrace", "area": "Terrace", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "AS", "floor": "Terrace", "area": "Gym", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "AT", "floor": "Terrace", "area": "Powder Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "Not Started", "Not Started", "N/A"]}, {"cn": "AU", "floor": "Terrace", "area": "Jacuzzi", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "AV", "floor": "Terrace", "area": "Lift Lobby", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "Not Started", "N/A", "Not Started", "Not Started"]}, {"cn": "CN", "floor": "FLR", "area": "AREA", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started"]}, {"cn": "A", "floor": "GF", "area": "Reception", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "B", "floor": "GF", "area": "Lobby", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "C", "floor": "GF", "area": "Managing Director", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "D", "floor": "GF", "area": "Staircase", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "E", "floor": "GF", "area": "Mother's Bedroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "F", "floor": "GF", "area": "Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "Not Started", "Not Started", "N/A"]}, {"cn": "G", "floor": "GF", "area": "Kitchen", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "H", "floor": "GF", "area": "Dry Kitchen", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "I", "floor": "GF", "area": "Lounge Dinning", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "J", "floor": "GF", "area": "Pantry", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "K", "floor": "GF", "area": "Living Room", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "L", "floor": "GF", "area": "PDR Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "Not Started", "Not Started", "N/A"]}, {"cn": "M", "floor": "GF", "area": "Verandah", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "N", "floor": "GF", "area": "Meeting Room", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "O", "floor": "GF", "area": "Office PDR Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "Not Started", "Not Started", "N/A"]}, {"cn": "P", "floor": "1F", "area": "Parent's Bedroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "Q", "floor": "1F", "area": "Master Bed Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "Not Started", "Not Started", "N/A"]}, {"cn": "R", "floor": "1F", "area": "Closet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "S", "floor": "1F", "area": "Staircase", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "T", "floor": "1F", "area": "Son's Bedroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "U", "floor": "1F", "area": "Son's Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "Not Started", "Not Started", "N/A"]}, {"cn": "V", "floor": "1F", "area": "Closet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "W", "floor": "1F", "area": "Lounge", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "X", "floor": "1F", "area": "Bar & Lounge Sitting", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "Y", "floor": "1F", "area": "Guest Bedroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "Z", "floor": "1F", "area": "Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "Not Started", "Not Started", "N/A"]}, {"cn": "AA", "floor": "1F", "area": "Home Theater", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AB", "floor": "1F", "area": "Deck", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AC", "floor": "1F", "area": "Puja", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AD", "floor": "Facade", "area": "Front Elevation", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AE", "floor": "1F", "area": "Powder Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "Not Started", "Not Started", "N/A"]}, {"cn": "AG", "floor": "Terrace", "area": "Gym", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AH", "floor": "Terrace", "area": "Spa", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AJ", "floor": "Terrace", "area": "Utility", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "CN", "floor": "FLR", "area": "AREA", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started"]}, {"cn": "A", "floor": "GF", "area": "Lobby", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "B", "floor": "GF", "area": "Living Room", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "C", "floor": "GF", "area": "Guest Bedroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "D", "floor": "GF", "area": "Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "Not Started", "Not Started", "N/A"]}, {"cn": "E", "floor": "GF", "area": "Kitchen", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "F", "floor": "GF", "area": "Parent's Bedroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "G", "floor": "GF", "area": "Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "Not Started", "Not Started", "N/A"]}, {"cn": "H", "floor": "GF", "area": "PDR Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "Not Started", "Not Started", "N/A"]}, {"cn": "I", "floor": "1F", "area": "Passage Area", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "J", "floor": "1F", "area": "Entertaiinment area", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "K", "floor": "1F", "area": "Front Bedroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "L", "floor": "1F", "area": "Front Dresser", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "M", "floor": "1F", "area": "Front Wasroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "N", "floor": "1F", "area": "Master Bedroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "O", "floor": "1F", "area": "Master Dresser", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "P", "floor": "1F", "area": "Master Wasroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "Q", "floor": "2F", "area": "Passage Area", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "R", "floor": "2F", "area": "Living Room", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "S", "floor": "2F", "area": "Front Bedroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "T", "floor": "2F", "area": "Front Dresser & Wasroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "U", "floor": "2F", "area": "Kitchen", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "V", "floor": "2F", "area": "Parent's Bedroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "W", "floor": "2F", "area": "Parent's Wasroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "X", "floor": "2F", "area": "PDR Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "Not Started", "Not Started", "N/A"]}, {"cn": "Y", "floor": "Facade", "area": "Front Elevation", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "Z", "floor": "3F", "area": "Passage Area", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AA", "floor": "3F", "area": "Guest Bedroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AB", "floor": "3F", "area": "Kids Room", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AC", "floor": "3F", "area": "Kids Dresser", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AD", "floor": "3F", "area": "Kids Wasroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AE", "floor": "3F", "area": "Master Bedroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AF", "floor": "3F", "area": "Master Dresser", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AG", "floor": "3F", "area": "Master Wasroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AH", "floor": "Stilt", "area": "Car Parking", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AI", "floor": "Stilt", "area": "Lounge", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AJ", "floor": "Stilt", "area": "Closet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AK", "floor": "Stilt", "area": "Staff Room & Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AL", "floor": "Stilt", "area": "PDR Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AM", "floor": "Terrace", "area": "Pergola & Terrace", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AN", "floor": "Terrace", "area": "Lounge Area", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AO", "floor": "Terrace", "area": "PDR Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AP", "floor": "Terrace", "area": "Staircase", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "CN", "floor": "FLR", "area": "AREA", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started"]}, {"cn": "A", "floor": "GF", "area": "Lounge", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "B", "floor": "GF", "area": "Office Area", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "C", "floor": "GF", "area": "Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "Not Started", "Not Started", "N/A"]}, {"cn": "D", "floor": "GF", "area": "Staircase", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "E", "floor": "1F", "area": "Drawing Room", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "F", "floor": "1F", "area": "Show Kitchen", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "G", "floor": "1F", "area": "Pooja", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "H", "floor": "1F", "area": "Balcony", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "I", "floor": "1F", "area": "Drawing Room", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "J", "floor": "1F", "area": "Garden", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "K", "floor": "1F", "area": "Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "Not Started", "Not Started", "N/A"]}, {"cn": "L", "floor": "1F", "area": "Staircase", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "M", "floor": "2F", "area": "Double height Above", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "N", "floor": "2F", "area": "Son's Bedroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "O", "floor": "2F", "area": "Son's Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "Not Started", "Not Started", "N/A"]}, {"cn": "P", "floor": "2F", "area": "Guest Bedroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "Q", "floor": "2F", "area": "Guest toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "Not Started", "Not Started", "N/A"]}, {"cn": "R", "floor": "2F", "area": "Lockable Store", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "S", "floor": "2F", "area": "Master Bedroom", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "T", "floor": "2F", "area": "Master Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "Not Started", "Not Started", "N/A"]}, {"cn": "U", "floor": "2F", "area": "Balcony", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "V", "floor": "Terrace", "area": "Passage & Lobby", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "W", "floor": "Terrace", "area": "PDR", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "X", "floor": "Terrace", "area": "Open Terrece", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "Y", "floor": "Terrace", "area": "Pentry", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "Z", "floor": "Terrace", "area": "Home Theatar", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AA", "floor": "SF", "area": "Paved Green", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AB", "floor": "SF", "area": "Stilt Parking", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AC", "floor": "SF", "area": "Staircase & Lobby", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AD", "floor": "SF", "area": "Store Room", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AE", "floor": "SF", "area": "Servent Room", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "N/A", "Not Started", "N/A"]}, {"cn": "AF", "floor": "SF", "area": "Servent Toilet", "received": [false, false, false, false, false], "statuses": ["Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "N/A", "N/A", "Not Started", "Not Started", "N/A"]}];
const DASHBOARD_SAMPLE_LOGS = [{"date": "2026-06-08", "project": "East Punjabi Bagh", "purpose": "Light Dimensioning", "zone": "3F", "type": "RCP", "duration": "7.5", "person": "Bhaskar", "remark": "system kept crashing and freezing the whole day"}, {"date": "2026-06-09", "project": "East Punjabi Bagh", "purpose": "Dimensioning & Circuitry", "zone": "3F", "type": "CIR", "duration": "7.5", "person": "Bhaskar", "remark": "3F EPB. system crash problem, file changes done."}, {"date": "2026-06-11", "project": "East Punjabi Bagh", "purpose": "Zoning", "zone": "4F", "type": "Zoning", "duration": "0.5", "person": "Bhaskar", "remark": "-"}, {"date": "2026-06-16", "project": "East Punjabi Bagh", "purpose": "Floor Lighting Plan + Project coordination & handling", "zone": "4F", "type": "FLR", "duration": "6", "person": "Bhaskar", "remark": "System still slow, coordinated with Aarif for files required"}, {"date": "", "project": "Project", "purpose": "Purpose", "zone": "Floor | Zone", "type": "Type", "duration": "Duration", "person": "By [Person 1]", "remark": "Remark"}, {"date": "2026-06-08", "project": "East Punjabi Bagh", "purpose": "Light Dimensioning", "zone": "3F", "type": "RCP", "duration": "7.5", "person": "Bhaskar", "remark": "system kept crashing and freezing the whole day"}, {"date": "2026-06-11", "project": "East Punjabi Bagh", "purpose": "Zoning", "zone": "4F", "type": "Zoning", "duration": "0.5", "person": "Bhaskar", "remark": "-"}, {"date": "2026-06-16", "project": "East Punjabi Bagh", "purpose": "Floor Lighting Plan + Project coordination & handling", "zone": "4F", "type": "FLR", "duration": "6", "person": "Bhaskar", "remark": "System still slow, coordinated with Aarif for files required"}, {"date": "", "project": "Project", "purpose": "Purpose", "zone": "Floor | Zone", "type": "Type", "duration": "Duration", "person": "By [Person 1]", "remark": "Remark"}, {"date": "2026-06-08", "project": "East Punjabi Bagh", "purpose": "Light Dimensioning", "zone": "3F", "type": "RCP", "duration": "7.5", "person": "Bhaskar", "remark": "system kept crashing and freezing the whole day"}, {"date": "2026-06-11", "project": "East Punjabi Bagh", "purpose": "Zoning", "zone": "4F", "type": "Zoning", "duration": "0.5", "person": "Bhaskar", "remark": "-"}, {"date": "2026-06-16", "project": "East Punjabi Bagh", "purpose": "Floor Lighting Plan + Project coordination & handling", "zone": "4F", "type": "FLR", "duration": "6", "person": "Bhaskar", "remark": "System still slow, coordinated with Aarif for files required"}, {"date": "", "project": "Project", "purpose": "Purpose", "zone": "Floor | Zone", "type": "Type", "duration": "Duration", "person": "By [Person 1]", "remark": "Remark"}, {"date": "2026-06-08", "project": "East Punjabi Bagh", "purpose": "Light Dimensioning", "zone": "3F", "type": "RCP", "duration": "7.5", "person": "Bhaskar", "remark": "system kept crashing and freezing the whole day"}, {"date": "2026-06-11", "project": "East Punjabi Bagh", "purpose": "Zoning", "zone": "4F", "type": "Zoning", "duration": "0.5", "person": "Bhaskar", "remark": "-"}, {"date": "2026-06-16", "project": "East Punjabi Bagh", "purpose": "Floor Lighting Plan + Project coordination & handling", "zone": "4F", "type": "FLR", "duration": "6", "person": "Bhaskar", "remark": "System still slow, coordinated with Aarif for files required"}, {"date": "", "project": "Project", "purpose": "Purpose", "zone": "Floor | Zone", "type": "Type", "duration": "Duration", "person": "By [Person 1]", "remark": "Remark"}, {"date": "2026-06-08", "project": "East Punjabi Bagh", "purpose": "Light Dimensioning", "zone": "3F", "type": "RCP", "duration": "7.5", "person": "Bhaskar", "remark": "system kept crashing and freezing the whole day"}, {"date": "2026-06-11", "project": "East Punjabi Bagh", "purpose": "Zoning", "zone": "4F", "type": "Zoning", "duration": "0.5", "person": "Bhaskar", "remark": "-"}, {"date": "2026-06-16", "project": "East Punjabi Bagh", "purpose": "Floor Lighting Plan + Project coordination & handling", "zone": "4F", "type": "FLR", "duration": "6", "person": "Bhaskar", "remark": "System still slow, coordinated with Aarif for files required"}];

/*
  Drawing receipt is only a trigger.
  Design numbers belong to DEPENDENT TASKS, never to receipt checkboxes.
*/
const DRAWING_TASK_DEPENDENCIES = {
  0:[0,2],       // Layout -> Concept/2D + Decorative Selection
  1:[3,10],      // Wall Electrical received -> WE drawings + Furniture drawings
  2:[4],         // False Ceiling received -> False Ceiling drawings
  3:[8],         // Detail received -> Bathroom/detail elevation
  4:[1]          // 3D received -> 3D renders
};

const taskStatusTone = s => {
  const x=String(s||"").toLowerCase();
  if(x==="locked" || x==="waiting for drawing") return {bg:"#EEEDE9",fg:"#777",dot:"#AAA"};
    if(x.includes("complete")) return {bg:"#E8F2E9",fg:"#245C2B",dot:"#2E7D32"};
  if(x.includes("progress")) return {bg:"#FFF4D6",fg:"#7A5A00",dot:"#D9A514"};
  return {bg:"#F8E8E6",fg:"#7B2821",dot:"#B3261E"};
};

function normaliseDrawingZones(project){
  const source=project?.drawingDashboardZones?.length?project.drawingDashboardZones:DASHBOARD_SAMPLE_ZONES;
  return source.map(z=>({
    ...z,
    received:Array.from({length:5},(_,i)=>Boolean(z.received?.[i])),
    statuses:Array.from({length:DASHBOARD_WORK_TYPES.length},(_,i)=>{const v=z.statuses?.[i];return (!v||v==="N/A")?"Not Started":v;}),
    taskDesignNos:Array.from({length:DASHBOARD_WORK_TYPES.length},(_,i)=>z.taskDesignNos?.[i]||"")
  }));
}

function makeTaskDesignNo(project,zone,taskIndex){
  const pno=String(project?.number||project?.projectNo||project?.id||"PRJ").replace(/\s+/g,"").toUpperCase();
  const floor=String(zone.floor||"FLR").replace(/\s+/g,"").toUpperCase();
  const taskCodes=["CON","3D","DEC","WE","FC","LGT","SE","FE","BE","BOQ","FUR"];
  const cn=String(zone.cn||"00").toUpperCase();
  return `${pno}/${floor}/${taskCodes[taskIndex]}/${cn}`;
}

function openDependentTasks(project,zone,drawingIndex,intakes){
  const statuses=[...zone.statuses];
  const taskDesignNos=[...zone.taskDesignNos];
  const nextIntakes=[...(intakes||[])];

  (DRAWING_TASK_DEPENDENCIES[drawingIndex]||[]).forEach(taskIndex=>{
    if(statuses[taskIndex]==="Locked" || statuses[taskIndex]==="Waiting for Drawing"){
      statuses[taskIndex]="Not Started";
    }
    if(!taskDesignNos[taskIndex]){
      taskDesignNos[taskIndex]=makeTaskDesignNo(project,zone,taskIndex);
    }
    const designNo=taskDesignNos[taskIndex];
    if(!nextIntakes.some(t=>t.designNo===designNo)){
      nextIntakes.unshift({
        id:`WIH-${Date.now()}-${taskIndex}`,
        projectId:project.id,
        project:project.name,
        designNo,
        drawingType:DASHBOARD_WORK_TYPES[taskIndex],
        taskTitle:DASHBOARD_WORK_TYPES[taskIndex],
        title:`${DASHBOARD_WORK_TYPES[taskIndex]} · ${zone.floor} · ${zone.area}`,
        floor:zone.floor,
        area:zone.area,
        zones:`${zone.floor} · ${zone.area}`,
        status:"To do",
        assignee:"",
        assigneeId:"",
        createdDate:new Date().toISOString().slice(0,10),
        source:"Drawing dependency",
        requiresCompletionUpload:true
      });
    }
  });
  return {statuses,taskDesignNos,nextIntakes};
}

function syncReceivedClassify(project,zones,intakes){
  const next=zones.map(z=>({...z,received:[...z.received],statuses:[...z.statuses],taskDesignNos:[...z.taskDesignNos]}));
  let syncedIntakes=[...(intakes||[])];

  (intakes||[]).filter(x=>x.projectId===project.id && String(x.source||"").toLowerCase().includes("received")).forEach(item=>{
    const type=String(item.drawingType||item.type||"").toLowerCase();
    const ri=type.includes("wall electrical")||type==="we"?1:type.includes("false ceiling")||type==="fc"?2:type.includes("detail")?3:type.includes("3d")?4:type.includes("layout")?0:-1;
    if(ri<0)return;
    const itemAreas=(Array.isArray(item.areas)&&item.areas.length
      ? item.areas
      : String(item.area||item.zone||"").split(","))
      .map(x=>String(x).trim()).filter(Boolean);
    const matchingIndexes=next.map((z,idx)=>(
      (!item.floor || String(z.floor).toLowerCase()===String(item.floor).toLowerCase()) &&
      (itemAreas.length===0 || itemAreas.some(a=>a.toLowerCase()===String(z.area).toLowerCase()))
    )?idx:-1).filter(idx=>idx>=0);
    matchingIndexes.forEach(zi=>{
      next[zi].received[ri]=true;
      const opened=openDependentTasks(project,next[zi],ri,syncedIntakes);
      next[zi].statuses=opened.statuses;
      next[zi].taskDesignNos=opened.taskDesignNos;
      syncedIntakes=opened.nextIntakes;
    });
  });
  return {zones:next,intakes:syncedIntakes};
}


function designDashboardScopeFloors(project){
  const s=project?.scope||{};
  const defs=[
    ["basement","Basement"],["stilt_floor","Stilt Floor"],["gf","GF"],["1f","1F"],["2f","2F"],["3f","3F"],
    ["terrace","Terrace"],["facade","Facade"],["wall_elevation","Wall Elevation"],["landscape","Landscape"],
    ["bath_elevation","Bath Elevation"],["wardrobe","Wardrobe"],["kitchen","Kitchen"]
  ];
  return defs.filter(([key])=>Boolean(s[key])).map(([,label])=>label);
}


function syncFloorZonesToDashboard(project,zones){
  const selected=designDashboardScopeFloors(project);
  const savedRows=project?.floorZones||Object.entries(project?.zones||{}).map(([zoneCode,v])=>({zoneCode,floor:v?.floor,area:v?.room}));
  const authoritative=(savedRows||[]).filter(r=>{
    const floor=String(r.floor||"").trim(), area=String(r.area||r.room||"").trim();
    return floor&&area&&selected.includes(floor);
  });
  // Floor / Zone is the single source of truth for dashboard areas.  Old dashboard-only
  // rows (including rows accidentally created from Line of Work tasks) are discarded.
  const existing=Array.isArray(zones)?zones:[];
  const next=[];
  authoritative.forEach((r,i)=>{
    const floor=String(r.floor||"").trim(), area=String(r.area||r.room||"").trim();
    if(next.some(z=>String(z.floor).toLowerCase()===floor.toLowerCase()&&String(z.area).toLowerCase()===area.toLowerCase()))return;
    const old=existing.find(z=>String(z.floor||"").toLowerCase()===floor.toLowerCase()&&String(z.area||"").toLowerCase()===area.toLowerCase());
    next.push({
      ...(old||{}),
      cn:r.zoneCode||r.cn||old?.cn||"",
      floor,area,
      sourceFloorZoneId:r.floorZoneId||old?.sourceFloorZoneId||"",
      received:Array.isArray(old?.received)?old.received:Array(5).fill(false),
      statuses:Array.isArray(old?.statuses)?old.statuses:Array(DASHBOARD_WORK_TYPES.length).fill("Not Started"),
      taskDesignNos:Array.isArray(old?.taskDesignNos)?old.taskDesignNos:Array(DASHBOARD_WORK_TYPES.length).fill("")
    });
  });
  next.forEach((z,i)=>{if(!z.cn)z.cn=String.fromCharCode(65+(i%26));});
  return next;
}

function dashboardTaskRows(project){
  const rows=project?.lineOfWorkResidence||project?.lineOfWork||[];
  return (Array.isArray(rows)?rows:[]).filter(r=>!String(r.milestone||"").trim());
}
function taskAreaName(r){return String(r.area||r.drawings||r.title||r.drawing||r.work||"").trim();}
function syncTaskRowsToDashboardZones(project,zones){
  const selected=designDashboardScopeFloors(project);
  const next=(zones||[]).filter(z=>selected.includes(z.floor)).map(z=>({...z}));
  dashboardTaskRows(project).forEach(r=>{
    const floor=String(r.floor||r.floorZone||r.zone||"").trim();
    const area=taskAreaName(r);
    if(!floor||!area||!selected.includes(floor))return;
    const idx=next.findIndex(z=>String(z.floor).toLowerCase()===floor.toLowerCase()&&String(z.area).toLowerCase()===area.toLowerCase());
    if(idx<0)next.push({
      cn:r.cn||"",
      floor,area,
      sourceTaskId:r.id||"",
      received:Array(5).fill(false),
      statuses:Array(DASHBOARD_WORK_TYPES.length).fill("Not Started"),
      taskDesignNos:Array(DASHBOARD_WORK_TYPES.length).fill("")
    });
    else next[idx]={...next[idx],sourceTaskId:r.id||next[idx].sourceTaskId||""};
  });
  // Fill missing CN values without changing existing ones.
  next.forEach((z,i)=>{if(!z.cn)z.cn=String.fromCharCode(65+(i%26));});
  return next;
}

function DrawingControlDashboard({state,persist,projectId}){
  const activeProjects=(state.projects||[]).filter(p=>p.status!=="Completed"&&p.projectControl?.projectStatus!=="Completed");
  const project=activeProjects.find(p=>String(p.id)===String(projectId))||activeProjects[0];
  const [floor,setFloor]=useState("All");
  const [expanded,setExpanded]=useState({});
  const [areaEditor,setAreaEditor]=useState(null);
  const [taskEditor,setTaskEditor]=useState(null);
  const [wihWorkRows,setWihWorkRows]=useState([]);
  const scopeFloors=project?designDashboardScopeFloors(project):[];
  const initialZones=project?.drawingDashboardZones?.length?normaliseDrawingZones(project):[];
  const floorZoneInitial=project?syncFloorZonesToDashboard(project,initialZones):[];
  const initial=project?syncReceivedClassify(project,floorZoneInitial,state.intakes):{zones:[],intakes:state.intakes||[]};
  const [zones,setZones]=useState(initial.zones);
  // Project Work Log is calculated only from completed WIH tasks in Google Sheets.
  // The hours entered by the doer at COMPLETE / UPLOAD become totalMinutes in WIH.
  const logs=wihWorkRows.filter(r=>/completed|done/i.test(String(r.status||r.task?.status||""))).map(r=>({
    date:String(r.updatedAt||r.stopAt||r.task?.completedAt||"").slice(0,10),
    project:project?.name||"",
    purpose:r.task?.taskType||"Design Task",
    zone:[r.task?.floor,r.task?.area].filter(Boolean).join(" · "),
    type:r.task?.dependencyDrawingType||r.task?.taskType||"",
    duration:Number(r.totalMinutes||0)/60,
    person:r.assigneeName||r.task?.assigneeName||"Unassigned",
    remark:r.notes||r.task?.remarks||""
  }));

  // Google Sheets is authoritative for received flags, permanent Design Nos. and task status.
  // This prevents the dashboard from inventing a second local task/design number.
  const applyBackendDashboard = (baseZones, payload) => {
    const rows=Array.isArray(payload?.rows)?payload.rows:[];
    if(!rows.length)return baseZones;
    const taskDefs=[
      {i:0,id:"conceptTaskId",no:"conceptDesignNo",st:"conceptStatus"},
      {i:1,id:"renders3dTaskId",no:"renders3dDesignNo",st:"renders3dStatus"},
      {i:2,id:"decorativeSelectionTaskId",no:"decorativeSelectionDesignNo",st:"decorativeSelectionStatus"},
      {i:3,id:"wallElectricalTaskId",no:"wallElectricalDesignNo",st:"wallElectricalStatus"},
      {i:4,id:"falseCeilingTaskId",no:"falseCeilingDesignNo",st:"falseCeilingStatus"},
      {i:5,id:"lightTaskId",no:"lightDesignNo",st:"lightStatus"},
      {i:6,id:"slabElectricalTaskId",no:"slabElectricalDesignNo",st:"slabElectricalStatus"},
      {i:7,id:"facadeElevationTaskId",no:"facadeElevationDesignNo",st:"facadeElevationStatus"},
      {i:8,id:"bathroomElevationTaskId",no:"bathroomElevationDesignNo",st:"bathroomElevationStatus"},
      {i:9,id:"documentationBoqTaskId",no:"documentationBoqDesignNo",st:"documentationBoqStatus"},
      {i:10,id:"furnitureTaskId",no:"furnitureDesignNo",st:"furnitureStatus"}
    ];
    return baseZones.map(z=>{
      const r=rows.find(x=>String(x.floor||"").toLowerCase()===String(z.floor||"").toLowerCase()&&String(x.area||"").toLowerCase()===String(z.area||"").toLowerCase());
      if(!r)return z;
      const received=[Boolean(r.layoutReceived),Boolean(r.weReceived),Boolean(r.fcReceived),Boolean(r.detailReceived),Boolean(r["3dReceived"])];
      const statuses=[...z.statuses],taskDesignNos=[...z.taskDesignNos];
      taskDefs.forEach(d=>{
        if(r[d.id]||r[d.no]){ taskDesignNos[d.i]=String(r[d.no]||""); statuses[d.i]=String(r[d.st]||"Not Started"); }
      });
      return {...z,received,statuses,taskDesignNos};
    });
  };

  useEffect(()=>{
    let alive=true;
    if(!project?.id){setWihWorkRows([]);return ()=>{alive=false;};}
    projectApi.getWIH(true,project.id).then(rows=>{
      if(!alive)return;
      const all=Array.isArray(rows)?rows:[];
      setWihWorkRows(all.filter(r=>String(r.projectId||r.task?.projectId||"")===String(project.id)));
    }).catch(err=>{console.warn("Project Work Log WIH sync failed",err);if(alive)setWihWorkRows([]);});
    return ()=>{alive=false;};
  },[project?.id]);

  useEffect(()=>{
    if(project){
      const selected=designDashboardScopeFloors(project);
      const source=project?.drawingDashboardZones?.length?normaliseDrawingZones(project):[];
      const withFloorZones=syncFloorZonesToDashboard(project,source);
      const synced=syncReceivedClassify(project,withFloorZones,state.intakes);
      setZones(synced.zones);
      // Refresh authoritative IDs/statuses from Google Sheets whenever this project opens.
      projectApi.getDesignDashboard(project.id).then(payload=>{
        setZones(current=>applyBackendDashboard(current,payload));
      }).catch(err=>console.warn("Design Dashboard backend sync failed",err));
      setExpanded(x=>Object.fromEntries(selected.map(f=>[f,x[f]!==false])));
      if(floor!=="All"&&!selected.includes(floor))setFloor("All");
    }
  },[project?.id,project?.floorZones,project?.zones,project?.drawingDashboardZones,state.intakes]);

  if(!project)return <div style={{fontFamily:FONT_BODY,color:T.inkDim}}>No active project available. Completed projects are excluded from Design Dashboard.</div>;

  const floors=["All",...scopeFloors];
  const visibleFloors=scopeFloors.filter(f=>floor==="All"||floor===f);
  const totalHours=logs.reduce((s,r)=>s+(Number(r.duration)||0),0);
  const personHours=Object.entries(logs.reduce((a,r)=>{const p=r.person||"Unassigned";a[p]=(a[p]||0)+(Number(r.duration)||0);return a;},{})).sort((a,b)=>b[1]-a[1]);

  const saveState=async(nextZones,nextIntakes)=>{
    const projects=state.projects.map(p=>p.id===project.id?{...p,drawingDashboardZones:nextZones}:p);
    await persist({...state,projects,intakes:nextIntakes??state.intakes});
  };

  const nextCn=()=>{
    const n=zones.length;
    let x=n+1,s="";
    while(x>0){x--;s=String.fromCharCode(65+(x%26))+s;x=Math.floor(x/26);}
    return s;
  };
  const addArea=f=>setAreaEditor({mode:"add",index:-1,cn:nextCn(),floor:f,area:""});
  const editArea=i=>setAreaEditor({mode:"edit",index:i,cn:zones[i].cn||"",floor:zones[i].floor||scopeFloors[0]||"",area:zones[i].area||""});
  const saveArea=async()=>{
    if(!areaEditor?.area?.trim())return alert("Please enter Area / Room name.");
    if(!scopeFloors.includes(areaEditor.floor))return alert("Please select a floor from Project & Scope.");
    let next;
    if(areaEditor.mode==="edit") next=zones.map((z,i)=>i===areaEditor.index?{...z,cn:areaEditor.cn||z.cn,floor:areaEditor.floor,area:areaEditor.area.trim()}:z);
    else next=[...zones,{cn:areaEditor.cn||nextCn(),floor:areaEditor.floor,area:areaEditor.area.trim(),received:Array(5).fill(false),statuses:Array(DASHBOARD_WORK_TYPES.length).fill("Not Started"),taskDesignNos:Array(DASHBOARD_WORK_TYPES.length).fill("")}];
    setZones(next); setExpanded(x=>({...x,[areaEditor.floor]:true}));
    await saveState(next); setAreaEditor(null);
  };
  const deleteArea=async()=>{
    if(areaEditor?.mode!=="edit")return;
    if(!window.confirm(`Remove ${areaEditor.area} from Design Dashboard?`))return;
    const next=zones.filter((_,i)=>i!==areaEditor.index);
    setZones(next); await saveState(next); setAreaEditor(null);
  };


  const openAddTask=f=>setTaskEditor({
    mode:"add",id:"",floor:f||scopeFloors[0]||"",drawings:"",tasks:"",
    responsible:"",status:"Not Started",plannedStart:"",plannedCompletion:"",hours:""
  });
  const openEditTask=r=>setTaskEditor({
    mode:"edit",id:r.id||"",floor:r.floor||r.floorZone||r.zone||"",
    drawings:taskAreaName(r),tasks:r.tasks||r.task||"",
    responsible:r.responsible||r.responsiblePerson||r.assignee||"",
    status:r.status||r.taskStatus||"Not Started",
    plannedStart:r.plannedStart||r.plannedStartDate||"",
    plannedCompletion:r.plannedCompletion||r.plannedCompletionDate||"",
    hours:r.hours??r.plannedHours??""
  });
  const taskPeople=()=>{
    const a=[];
    Object.values(project?.contacts||{}).forEach(c=>{if(c?.name&&!a.includes(c.name))a.push(c.name);});
    (state.team||[]).forEach(x=>{const n=x?.name||x;if(n&&!a.includes(n))a.push(n);});
    return a;
  };
  const saveTaskEditor=async()=>{
    if(!taskEditor?.floor||!taskEditor?.drawings?.trim())return alert("Please select Floor and enter Area / Room.");
    const old=dashboardTaskRows(project);
    let nextRows;
    if(taskEditor.mode==="edit"){
      nextRows=old.map(r=>String(r.id)===String(taskEditor.id)?{
        ...r,floor:taskEditor.floor,drawings:taskEditor.drawings.trim(),tasks:taskEditor.tasks,
        responsible:taskEditor.responsible,status:taskEditor.status,
        plannedStart:taskEditor.plannedStart,plannedCompletion:taskEditor.plannedCompletion,hours:taskEditor.hours
      }:r);
    }else{
      nextRows=[...old,{
        id:uid(),projectId:project.id,sourceRow:old.length+1,milestone:"",
        floor:taskEditor.floor,drawings:taskEditor.drawings.trim(),tasks:taskEditor.tasks,
        responsible:taskEditor.responsible,status:taskEditor.status,
        plannedStart:taskEditor.plannedStart,plannedCompletion:taskEditor.plannedCompletion,hours:taskEditor.hours
      }];
    }
    try{
      const saved=await projectApi.saveLineOfWork(project.id,nextRows);
      const rows=Array.isArray(saved)&&saved.length?saved:nextRows;
      const projectNext={...project,lineOfWorkResidence:rows,lineOfWork:rows};
      const nextZones=syncTaskRowsToDashboardZones(projectNext,zones);
      projectNext.drawingDashboardZones=nextZones;
      setZones(nextZones);
      await persist({...state,projects:(state.projects||[]).map(p=>p.id===project.id?projectNext:p)});
      setTaskEditor(null);
    }catch(err){alert(`Task save failed: ${err?.message||err}`);}
  };

  // Manual checkbox remains useful for testing, but production source is Received & Classify.
  const toggleReceived=async(zi,ri)=>{
    const zone=zones[zi];
    const nowReceived=!zone.received[ri];
    let nextIntakes=[...(state.intakes||[])];
    let statuses=[...zone.statuses];
    let taskDesignNos=[...zone.taskDesignNos];

    if(nowReceived){
      const opened=openDependentTasks(project,{...zone,statuses,taskDesignNos},ri,nextIntakes);
      statuses=opened.statuses;
      taskDesignNos=opened.taskDesignNos;
      nextIntakes=opened.nextIntakes;
    }

    const nextZones=zones.map((z,i)=>i===zi?{
      ...z,
      received:z.received.map((v,j)=>j===ri?nowReceived:v),
      statuses,
      taskDesignNos
    }:z);
    setZones(nextZones);
    await saveState(nextZones,nextIntakes);
  };

  const cycleTask=async(zi,si)=>{
    const z=zones[zi];
    const cur=z.statuses[si]||"Locked";
    if(cur==="Locked"||cur==="Waiting for Drawing")return;
    // Dashboard mirrors WIH; this click is only a prototype/test helper.
    const next=cur==="Not Started"?"In Progress":cur==="In Progress"?"Completed":"Not Started";
    const nextZones=zones.map((row,i)=>i===zi?{...row,statuses:row.statuses.map((v,j)=>j===si?next:v)}:row);
    setZones(nextZones);
    await saveState(nextZones);
  };

  return <div>
    <div style={{marginBottom:22}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div>
          <div style={{fontFamily:FONT_MONO,fontSize:10,fontWeight:700}}>FLOOR / AREA / TASK MASTER</div>
          <div style={{fontFamily:FONT_BODY,fontSize:11,color:T.inkDim,marginTop:3}}>Add or edit here. The Design Dashboard below is generated from the same project task data.</div>
        </div>
        <button type="button" disabled={!scopeFloors.length} onClick={()=>openAddTask(scopeFloors[0])} style={{...smallBtn,background:T.navy,color:"#fff",padding:"9px 14px"}}>+ ADD TASK</button>
      </div>
      {scopeFloors.map(f=>{
        const taskRows=dashboardTaskRows(project).filter(r=>String(r.floor||r.floorZone||r.zone||"")===f);
        return <div key={f} style={{border:`1px solid ${T.line}`,background:"#fff",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:T.paper2,borderBottom:`1px solid ${T.line}`}}>
            <strong style={{fontFamily:FONT_DISPLAY}}>{f} · {taskRows.length} tasks</strong>
            <button type="button" onClick={()=>openAddTask(f)} style={{...smallBtn,background:"#fff"}}>+ TASK</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1.4fr 2fr 1fr 120px 80px",fontFamily:FONT_BODY,fontSize:11,fontWeight:700,borderBottom:`1px solid ${T.line}`}}>
            {["Area / Room","Task","Responsible","Status","Action"].map(h=><div key={h} style={{padding:8}}>{h}</div>)}
          </div>
          {taskRows.map((r,i)=><div key={r.id||i} style={{display:"grid",gridTemplateColumns:"1.4fr 2fr 1fr 120px 80px",fontFamily:FONT_BODY,fontSize:11,borderBottom:i<taskRows.length-1?`1px solid ${T.line}`:"none"}}>
            <div style={{padding:8,fontWeight:600}}>{taskAreaName(r)||"—"}</div>
            <div style={{padding:8}}>{r.tasks||r.task||"—"}</div>
            <div style={{padding:8}}>{r.responsible||r.responsiblePerson||r.assignee||"—"}</div>
            <div style={{padding:8}}>{r.status||r.taskStatus||"Not Started"}</div>
            <div style={{padding:6}}><button type="button" onClick={()=>openEditTask(r)} style={{...smallBtn,background:"#fff"}}>EDIT</button></div>
          </div>)}
          {!taskRows.length&&<div style={{padding:10,fontFamily:FONT_BODY,fontSize:11,color:T.inkDim}}>No tasks added for {f}.</div>}
        </div>;
      })}
    </div>

    <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:16,marginBottom:18}}>
      <div>
        <h2 style={{fontFamily:FONT_DISPLAY,fontSize:22,margin:0,color:T.ink}}>Design Dashboard</h2>
        <div style={{fontFamily:FONT_BODY,fontSize:13,color:T.inkDim,marginTop:4}}>
          {project.name} · received drawings are triggers; Design Nos. belong to dependent tasks and flow into WIH.
        </div>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"end"}}>
        <Field label="Floor"><select value={floor} onChange={e=>setFloor(e.target.value)} style={{...inputStyle,borderRadius:0,minWidth:130}}>{floors.map(f=><option key={f}>{f}</option>)}</select></Field>
      </div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 330px",gap:16,alignItems:"start"}}>
      <div style={{minWidth:0,border:`1px solid ${T.line}`,background:"#fff",overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <div style={{minWidth:1650}}>
            {/* Two-level header, matching the original dashboard logic */}
            <div style={{display:"grid",gridTemplateColumns:"42px 52px 180px 470px 1fr",background:"#BDB8AC",color:"#1C1C19",borderBottom:`1px solid ${T.line}`,fontFamily:FONT_MONO,fontSize:9,fontWeight:700}}>
              <div style={{padding:7,borderRight:`1px solid ${T.line}`}}>CN</div>
              <div style={{padding:7,borderRight:`1px solid ${T.line}`}}>FLR</div>
              <div style={{padding:7,borderRight:`1px solid ${T.line}`}}>AREA</div>
              <div style={{padding:7,borderRight:`1px solid ${T.line}`,textAlign:"center"}}>DRAWINGS RECEIVED</div>
              <div style={{padding:7,textAlign:"center"}}>DEPENDENT DESIGN TASKS · DESIGN NO. / STATUS</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"42px 52px 180px repeat(5,94px) repeat(11,minmax(108px,1fr))",background:"#D2CDC1",color:"#1C1C19",borderBottom:`2px solid ${T.ink}`,fontFamily:FONT_MONO,fontSize:8,fontWeight:700}}>
              {["","","",...DASHBOARD_DRAWING_TYPES,...DASHBOARD_WORK_TYPES].map((h,i)=><div key={i} style={{padding:"9px 4px",borderRight:`1px solid ${T.line}`,background:"#D2CDC1",color:"#1C1C19",display:"flex",alignItems:"center",justifyContent:i>2?"center":"flex-start",textAlign:"center"}}>{h}</div>)}
            </div>

            {visibleFloors.map(f=>{
              const rows=zones.map((z,i)=>({...z,_i:i})).filter(z=>z.floor===f);
              const open=expanded[f]!==false;
              return <div key={f}>
                <div style={{width:"100%",borderBottom:`1px solid ${T.line}`,background:"#F4F2EC",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <button onClick={()=>setExpanded(x=>({...x,[f]:!open}))} style={{flex:1,border:0,background:"transparent",padding:"9px 10px",display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontFamily:FONT_BODY,fontWeight:700,color:T.ink,textAlign:"left"}}>{open?<ChevronDown size={14}/>:<ChevronRight size={14}/>} {f} · {rows.length} areas</button>
                </div>
                {open&&rows.map(z=><div key={z._i} style={{display:"grid",gridTemplateColumns:"42px 52px 180px repeat(5,94px) repeat(11,minmax(108px,1fr))",borderBottom:`1px solid ${T.line}`,fontFamily:FONT_BODY,fontSize:9}}>
                  <div style={{padding:7,borderRight:`1px solid ${T.line}`,fontFamily:FONT_MONO}}>{z.cn}</div>
                  <div style={{padding:7,borderRight:`1px solid ${T.line}`,fontFamily:FONT_MONO}}>{z.floor}</div>
                  <button type="button" onClick={()=>editArea(z._i)} title="Edit this area" style={{padding:7,border:0,borderRight:`1px solid ${T.line}`,background:"#fff",fontWeight:700,textAlign:"left",cursor:"pointer",textDecoration:"underline"}}>{z.area} <span style={{fontSize:8,color:T.inkDim}}>EDIT</span></button>

                  {/* Receipt cells: checkbox ONLY. No Design No. here. */}
                  {z.received.map((v,ri)=><button key={ri} onClick={()=>toggleReceived(z._i,ri)} title={v?"Drawing received":"Waiting for Received & Classify"} style={{border:0,borderRight:`1px solid ${T.line}`,background:v?"#E8F2E9":"#FAF9F5",color:v?"#245C2B":"#999",padding:"6px 3px",cursor:"pointer",minHeight:50}}>
                    <div style={{fontSize:17,fontWeight:800}}>{v?"☑":"☐"}</div>
                    <div style={{fontSize:7,marginTop:3}}>{v?"Received":"Waiting"}</div>
                  </button>)}

                  {/* Task cells: Design No. belongs HERE */}
                  {z.statuses.map((s,si)=>{
                    const tone=taskStatusTone(s);
                    const dno=z.taskDesignNos?.[si]||"";
                    const receivedOpened=!!dno && ["Not Started","Ready"].includes(String(s));
                    const taskBg=receivedOpened?"#DCEBFA":tone.bg;
                    const taskFg=receivedOpened?"#123F6D":tone.fg;
                    return <button key={si} onClick={()=>cycleTask(z._i,si)} style={{border:0,borderRight:`1px solid ${T.line}`,background:taskBg,color:taskFg,padding:"6px 4px",fontSize:8,cursor:(s==="Locked"||s==="Waiting for Drawing")?"default":"pointer",textAlign:"center",minHeight:50}}>
                      {!receivedOpened&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,fontWeight:700}}>
                        <span style={{width:6,height:6,borderRadius:"50%",background:tone.dot,flex:"0 0 auto"}}/>{s}
                      </div>}
                      {dno&&<div style={{fontFamily:FONT_MONO,fontSize:receivedOpened?11:9,fontWeight:800,marginTop:receivedOpened?0:4,lineHeight:1.25,letterSpacing:.2}}>{dno}</div>}
                      {receivedOpened&&<div style={{fontFamily:FONT_BODY,fontSize:7,fontWeight:700,marginTop:3,textTransform:"uppercase",letterSpacing:.6}}>Drawing Received</div>}
                    </button>;
                  })}
                </div>)}
              </div>;
            })}
          </div>
        </div>
        <div style={{padding:"10px 12px",fontFamily:FONT_BODY,fontSize:10,color:T.inkDim,borderTop:`1px solid ${T.line}`,lineHeight:1.5}}>
          Flow: Received & Classify upload → receipt checkbox updates → dependent task opens red as Not Started with its Design No. → WIH Start makes it In Progress → WIH Stop requires completed drawing upload → task becomes green Completed and hours are logged.
        </div>
      </div>

      <aside style={{border:`1px solid ${T.line}`,background:"#fff",position:"sticky",top:0}}>
        <div style={{padding:14,borderBottom:`2px solid ${T.ink}`}}>
          <div style={{fontFamily:FONT_MONO,fontSize:9,color:T.inkDim,letterSpacing:1}}>PROJECT WORK LOG · {project.no||project.projectNo||"—"}</div>
          <div style={{fontFamily:FONT_DISPLAY,fontSize:22,marginTop:3}}>{totalHours.toFixed(1)} hrs</div>
          <div style={{fontFamily:FONT_BODY,fontSize:11,color:T.inkDim}}>completed WIH hours logged on this project</div>
        </div>
        <div style={{padding:12,borderBottom:`1px solid ${T.line}`}}>
          <div style={{fontFamily:FONT_MONO,fontSize:9,fontWeight:700,marginBottom:8}}>HOURS BY PERSON</div>
          {personHours.slice(0,6).map(([p,h])=><div key={p} style={{display:"flex",justifyContent:"space-between",fontFamily:FONT_BODY,fontSize:11,padding:"4px 0"}}><span>{p}</span><strong>{h.toFixed(1)} h</strong></div>)}
        </div>
        <div style={{maxHeight:"55vh",overflowY:"auto"}}>
          {logs.map((r,i)=><div key={i} style={{padding:"10px 12px",borderBottom:`1px solid ${T.line}`}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:8,fontFamily:FONT_BODY,fontSize:11}}><strong>{r.person||"—"}</strong><strong>{Number(r.duration||0).toFixed(1)} h</strong></div>
            <div style={{fontFamily:FONT_BODY,fontSize:11,marginTop:3,color:T.ink}}>{r.purpose||"—"}</div>
            <div style={{fontFamily:FONT_MONO,fontSize:9,color:T.inkDim,marginTop:4}}>{[r.date,r.zone,r.type].filter(Boolean).join(" · ")}</div>
          </div>)}
        </div>
      </aside>
    </div>
    {!scopeFloors.length&&<div style={{marginTop:12,padding:14,border:`1px solid ${T.line}`,background:"#FFF4D6",fontFamily:FONT_BODY,fontSize:12}}>No floor/zone is selected for this project. Go to <strong>Project → Projects & Scope</strong>, edit the project scope and select GF / 1F / 2F / Terrace / Facade etc. Those selections will automatically appear here.</div>}
    {taskEditor&&<div style={{position:"fixed",inset:0,zIndex:12500,background:"rgba(8,25,45,.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"min(820px,96vw)",background:T.paper,border:`1px solid ${T.line}`}}>
        <div style={{background:T.navy,color:"#fff",padding:14,fontFamily:FONT_DISPLAY,fontSize:18}}>{taskEditor.mode==="edit"?"Edit":"Add"} Task · {project.no||project.projectNo}</div>
        <div style={{padding:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Floor / Zone"><select value={taskEditor.floor} onChange={e=>setTaskEditor(x=>({...x,floor:e.target.value}))} style={inputStyle}>{scopeFloors.map(f=><option key={f}>{f}</option>)}</select></Field>
          <Field label="Area / Room"><input value={taskEditor.drawings} onChange={e=>setTaskEditor(x=>({...x,drawings:e.target.value}))} style={inputStyle}/></Field>
          <div style={{gridColumn:"1 / -1"}}><Field label="Task"><textarea value={taskEditor.tasks} onChange={e=>setTaskEditor(x=>({...x,tasks:e.target.value}))} style={{...inputStyle,minHeight:70}}/></Field></div>
          <Field label="Responsible"><select value={taskEditor.responsible} onChange={e=>setTaskEditor(x=>({...x,responsible:e.target.value}))} style={inputStyle}><option value="">Select</option>{taskPeople().map(n=><option key={n}>{n}</option>)}</select></Field>
          <Field label="Status"><select value={taskEditor.status} onChange={e=>setTaskEditor(x=>({...x,status:e.target.value}))} style={inputStyle}><option>Not Started</option><option>In Progress</option><option>Completed</option></select></Field>
          <Field label="Planned Start"><input type="date" value={taskEditor.plannedStart} onChange={e=>setTaskEditor(x=>({...x,plannedStart:e.target.value}))} style={inputStyle}/></Field>
          <Field label="Planned Completion"><input type="date" value={taskEditor.plannedCompletion} onChange={e=>setTaskEditor(x=>({...x,plannedCompletion:e.target.value}))} style={inputStyle}/></Field>
        </div>
        <div style={{padding:14,borderTop:`1px solid ${T.line}`,display:"flex",justifyContent:"flex-end",gap:8}}>
          <button type="button" onClick={()=>setTaskEditor(null)} style={{...smallBtn,background:"#fff"}}>Cancel</button>
          <button type="button" onClick={saveTaskEditor} style={{...smallBtn,background:T.navy,color:"#fff"}}>Save Task</button>
        </div>
      </div>
    </div>}
    {areaEditor&&<div style={{position:"fixed",inset:0,zIndex:12000,background:"rgba(8,25,45,.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"min(620px,95vw)",background:T.paper,border:`1px solid ${T.line}`}}>
        <div style={{background:T.navy,color:"#fff",padding:14,fontFamily:FONT_DISPLAY,fontSize:18}}>{areaEditor.mode==="edit"?"Edit":"Add"} Design Dashboard Area · {project.no||project.projectNo}</div>
        <div style={{padding:16,display:"grid",gridTemplateColumns:"140px 1fr",gap:12}}>
          <Field label="CN"><input value={areaEditor.cn||""} onChange={e=>setAreaEditor(a=>({...a,cn:e.target.value}))} style={inputStyle}/></Field>
          <Field label="Floor / Zone from Project Scope"><select value={areaEditor.floor||""} onChange={e=>setAreaEditor(a=>({...a,floor:e.target.value}))} style={inputStyle}>{scopeFloors.map(f=><option key={f}>{f}</option>)}</select></Field>
          <div style={{gridColumn:"1 / -1"}}><Field label="Area / Room / Task Zone"><input autoFocus value={areaEditor.area||""} onChange={e=>setAreaEditor(a=>({...a,area:e.target.value}))} placeholder="e.g. Lobby, Bedroom 01, Washroom" style={inputStyle}/></Field></div>
        </div>
        <div style={{padding:14,borderTop:`1px solid ${T.line}`,display:"flex",justifyContent:"flex-end",gap:8}}>
          <div style={{display:"flex",gap:8}}><button type="button" onClick={()=>setAreaEditor(null)} style={{...smallBtn,background:"#fff"}}>Cancel</button><button type="button" onClick={saveArea} style={{...smallBtn,background:T.navy,color:"#fff"}}>Save Area</button></div>
        </div>
      </div>
    </div>}
  </div>;
}

function DesignFlowView({state,persist}){
  const [openId,setOpenId]=useState("");
  const [editId,setEditId]=useState("");
  const [taskId,setTaskId]=useState("");
  const [taskDraft,setTaskDraft]=useState({drawings:"",tasks:"",time:"",hours:"",plannedStart:"",plannedCompletion:"",responsible:"",status:"Not Started"});
  const [projectDraft,setProjectDraft]=useState({});
  const seen=new Set();
  const projects=(state.projects||[]).filter(p=>{
    if(p.completed||p.status==="Completed"||p.projectControl?.projectStatus==="Completed")return false;
    const k=String(p.id||p.no||p.name||"").toLowerCase();
    if(!k||seen.has(k))return false; seen.add(k); return true;
  });
  const opened=projects.find(p=>String(p.id)===String(openId));
  const editing=projects.find(p=>String(p.id)===String(editId));
  const taskProject=projects.find(p=>String(p.id)===String(taskId));

  const designRows=p=>{
    if(!p)return [];
    const people=[];
    Object.values(p.contacts||{}).forEach(c=>{if(c?.name)people.push(c.name);});
    return splitDesignExecutionRows(p,people).design||[];
  };
  const counts=p=>{
    const rows=designRows(p).filter(r=>String(r.tasks||r.task||r.drawings||r.title||"").trim());
    const completed=rows.filter(r=>["completed","complete"].includes(String(r.status||r.taskStatus||"").toLowerCase())||r.completed===true).length;
    return {open:Math.max(0,rows.length-completed),completed,total:rows.length};
  };
  const peopleFor=p=>{
    const a=[]; Object.values(p?.contacts||{}).forEach(c=>{if(c?.name&&!a.includes(c.name))a.push(c.name);});
    (state.team||[]).forEach(x=>{const n=x?.name||x;if(n&&!a.includes(n))a.push(n);}); return a;
  };

  const openProjectEdit=p=>{
    setProjectDraft({no:p.no||p.projectNo||"",name:p.name||"",client:p.client||p.contacts?.Owner?.name||"",architect:p.architect||p.contacts?.Architect?.name||"",address:p.address||"",projectType:p.projectType||"Residence",status:p.status||"Ongoing"});
    setEditId(String(p.id));
  };
  const saveProject=async()=>{
    if(!editing)return;
    const next={...editing,...projectDraft};
    try{await projectApi.update(frontendProjectToBackend(next,true));}catch(e){console.warn("Project backend update failed",e);}
    await persist({...state,projects:(state.projects||[]).map(p=>p.id===editing.id?next:p)});
    setEditId("");
  };

  const saveTask=async()=>{
    if(!taskProject)return;
    const existing=taskProject.lineOfWorkResidence||taskProject.lineOfWork||[];
    const row={id:uid(),projectId:taskProject.id,sourceRow:existing.length+1,...taskDraft,milestone:"",floor:"",visits:"",visitBy:""};
    const merged=[...existing,row];
    try{
      const saved=await projectApi.saveLineOfWork(taskProject.id,merged);
      const next={...taskProject,lineOfWorkResidence:saved||merged,lineOfWork:saved||merged};
      await persist({...state,projects:(state.projects||[]).map(p=>p.id===taskProject.id?next:p)});
      setTaskId(""); setTaskDraft({drawings:"",tasks:"",time:"",hours:"",plannedStart:"",plannedCompletion:"",responsible:"",status:"Not Started"});
    }catch(err){alert(`Task save failed: ${err?.message||err}`);}
  };

  if(opened)return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <div><div style={{fontFamily:FONT_MONO,fontSize:10,color:T.cyan}}>SELECTED PROJECT · {opened.no||opened.projectNo}</div><h2 style={{fontFamily:FONT_DISPLAY,margin:"3px 0"}}>{opened.name}</h2></div>
      <div style={{display:"flex",gap:8}}>
        <button type="button" onClick={()=>openProjectEdit(opened)} style={{...smallBtn,background:"#fff",cursor:"pointer",padding:"9px 14px"}}>EDIT PROJECT</button>
        <button type="button" onClick={()=>setOpenId("")} style={{...smallBtn,background:"#fff",cursor:"pointer",padding:"9px 14px"}}>PROJECT LIST</button>
      </div>
    </div>
    <div style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim,marginBottom:12}}>Design Dashboard floors/zones are linked directly to this project's selections in Projects & Scope. Add or edit areas inside each selected floor below.</div>
    <DrawingControlDashboard state={state} persist={persist} projectId={opened.id}/>
    {taskProject&&<div style={{position:"fixed",inset:0,zIndex:10000,background:"rgba(8,25,45,.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"min(900px,96vw)",background:T.paper,border:`1px solid ${T.line}`}}>
        <div style={{background:T.navy,color:"#fff",padding:14,fontFamily:FONT_DISPLAY,fontSize:18}}>Add Task · {taskProject.no} · {taskProject.name}</div>
        <div style={{padding:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Line of Work / Drawing"><input value={taskDraft.drawings} onChange={e=>setTaskDraft(d=>({...d,drawings:e.target.value}))} style={inputStyle}/></Field>
          <Field label="Responsible Person"><select value={taskDraft.responsible} onChange={e=>setTaskDraft(d=>({...d,responsible:e.target.value}))} style={inputStyle}><option value="">Select</option>{peopleFor(taskProject).map(n=><option key={n}>{n}</option>)}</select></Field>
          <div style={{gridColumn:"1 / -1"}}><Field label="Task"><textarea value={taskDraft.tasks} onChange={e=>setTaskDraft(d=>({...d,tasks:e.target.value}))} style={{...inputStyle,minHeight:70}}/></Field></div>
          <Field label="Planned Start"><input type="date" value={taskDraft.plannedStart} onChange={e=>setTaskDraft(d=>({...d,plannedStart:e.target.value}))} style={inputStyle}/></Field>
          <Field label="Planned Completion"><input type="date" value={taskDraft.plannedCompletion} onChange={e=>setTaskDraft(d=>({...d,plannedCompletion:e.target.value}))} style={inputStyle}/></Field>
          <Field label="Hours"><input type="number" value={taskDraft.hours} onChange={e=>setTaskDraft(d=>({...d,hours:e.target.value}))} style={inputStyle}/></Field>
          <Field label="Status"><select value={taskDraft.status} onChange={e=>setTaskDraft(d=>({...d,status:e.target.value}))} style={inputStyle}><option>Not Started</option><option>In Progress</option><option>Completed</option></select></Field>
        </div>
        <div style={{padding:16,borderTop:`1px solid ${T.line}`,display:"flex",justifyContent:"flex-end",gap:8}}><button type="button" onClick={()=>setTaskId("")} style={{...smallBtn,background:"#fff"}}>Cancel</button><button type="button" onClick={saveTask} style={{...smallBtn,background:T.navy,color:"#fff"}}>Save Task</button></div>
      </div>
    </div>}
    {editing&&<div style={{position:"fixed",inset:0,zIndex:10001,background:"rgba(8,25,45,.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"min(900px,96vw)",background:T.paper,border:`1px solid ${T.line}`}}>
        <div style={{background:T.navy,color:"#fff",padding:14,fontFamily:FONT_DISPLAY,fontSize:18}}>Edit Project · {editing.no}</div>
        <div style={{padding:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[["Project No.","no"],["Project Name","name"],["Client / Owner","client"],["Architect","architect"],["Address","address"]].map(([lab,key])=><Field key={key} label={lab}><input value={projectDraft[key]||""} onChange={e=>setProjectDraft(d=>({...d,[key]:e.target.value}))} style={inputStyle}/></Field>)}
          <Field label="Project Type"><select value={projectDraft.projectType||"Residence"} onChange={e=>setProjectDraft(d=>({...d,projectType:e.target.value}))} style={inputStyle}><option>Residence</option><option>Commercial</option><option>Hospitality</option><option>Retail</option><option>Other</option></select></Field>
        </div>
        <div style={{padding:16,borderTop:`1px solid ${T.line}`,display:"flex",justifyContent:"flex-end",gap:8}}><button type="button" onClick={()=>setEditId("")} style={{...smallBtn,background:"#fff"}}>Cancel</button><button type="button" onClick={saveProject} style={{...smallBtn,background:T.navy,color:"#fff"}}>Save Project</button></div>
      </div>
    </div>}
  </div>;

  return <div>
    <div style={{marginBottom:16}}><div style={{fontFamily:FONT_MONO,fontSize:10,color:T.cyan}}>PROJECT-WISE · DESIGN CONTROL</div><h2 style={{fontFamily:FONT_DISPLAY,margin:"4px 0"}}>Design Dashboard</h2><div style={{fontSize:12,color:T.inkDim}}>Open one project to manage its tasks and drawing dashboard.</div></div>
    <div style={{border:`1px solid ${T.line}`,background:"#fff",overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr style={{background:T.paper2}}>{["S. No","Project No.","Project","Client","Architect","Scope / Floors","Open Tasks","Completed Tasks","Action"].map(h=><th key={h} style={{padding:10,textAlign:"left",borderBottom:`1px solid ${T.line}`}}>{h}</th>)}</tr></thead>
        <tbody>{projects.map((p,i)=>{const c=counts(p);return <tr key={p.id}>
          <td style={{padding:10,borderBottom:`1px solid ${T.line}`}}>{i+1}</td><td style={{padding:10,borderBottom:`1px solid ${T.line}`,fontFamily:FONT_MONO}}>{p.no||p.projectNo||"—"}</td><td style={{padding:10,borderBottom:`1px solid ${T.line}`,fontWeight:700}}>{p.name}</td><td style={{padding:10,borderBottom:`1px solid ${T.line}`}}>{p.client||"—"}</td><td style={{padding:10,borderBottom:`1px solid ${T.line}`}}>{p.architect||"—"}</td><td style={{padding:10,borderBottom:`1px solid ${T.line}`,minWidth:190,maxWidth:520,whiteSpace:"normal",overflowWrap:"anywhere",lineHeight:1.45}}>{designDashboardScopeFloors(p).length?designDashboardScopeFloors(p).join(", "):"No scope selected"}</td><td style={{padding:10,borderBottom:`1px solid ${T.line}`,fontWeight:700}}>{c.open}</td><td style={{padding:10,borderBottom:`1px solid ${T.line}`,fontWeight:700}}>{c.completed}</td><td style={{padding:10,borderBottom:`1px solid ${T.line}`}}><div style={{display:"flex",gap:6}}><button type="button" onClick={()=>setOpenId(String(p.id))} style={{...smallBtn,background:T.navy,color:"#fff"}}>OPEN</button><button type="button" onClick={()=>openProjectEdit(p)} style={{...smallBtn,background:"#fff"}}>EDIT PROJECT</button></div></td>
        </tr>})}</tbody>
      </table>
    </div>
    {editing&&<div style={{position:"fixed",inset:0,zIndex:10001,background:"rgba(8,25,45,.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"min(900px,96vw)",background:T.paper,border:`1px solid ${T.line}`}}><div style={{background:T.navy,color:"#fff",padding:14,fontFamily:FONT_DISPLAY,fontSize:18}}>Edit Project · {editing.no}</div><div style={{padding:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{[["Project No.","no"],["Project Name","name"],["Client / Owner","client"],["Architect","architect"],["Address","address"]].map(([lab,key])=><Field key={key} label={lab}><input value={projectDraft[key]||""} onChange={e=>setProjectDraft(d=>({...d,[key]:e.target.value}))} style={inputStyle}/></Field>)}</div><div style={{padding:16,borderTop:`1px solid ${T.line}`,display:"flex",justifyContent:"flex-end",gap:8}}><button type="button" onClick={()=>setEditId("")} style={{...smallBtn,background:"#fff"}}>Cancel</button><button type="button" onClick={saveProject} style={{...smallBtn,background:T.navy,color:"#fff"}}>Save Project</button></div></div>
    </div>}
  </div>;
}
function ProjectInfoScopeMerged({state,persist,project}){
  if(!project)return <div style={{fontFamily:FONT_BODY,color:T.inkDim}}>Select a project.</div>;
  const scope=project.scope||{};
  const scopeFields=[
    ["Basement","basement"],["Stilt Floor","stiltFloor"],["GF","gf"],["1F","f1"],["2F","f2"],["3F","f3"],
    ["Terrace","terrace"],["Facade","facade"],["Wall Elevation","wallElevation"],["Landscape","landscape"],
    ["Bath Elevation","bathElevation"],["Wardrobe","wardrobe"],["Kitchen","kitchen"],["Onboarding","onboarding"]
  ];
  const updateProject=async patch=>{
    const projects=state.projects.map(p=>p.id===project.id?{...p,...patch}:p);
    await persist({...state,projects});
  };
  const updateScope=async(key,value)=>{
    await updateProject({scope:{...(project.scope||{}),[key]:value}});
  };
  return <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",border:`1px solid ${T.line}`,background:"#fff",marginBottom:16}}>
      {[
        ["Project No.",project.number||project.projectNo||"—"],
        ["Project Name",project.name||"—"],
        ["Current Stage",project.currentStage||project.stage||"—"],
        ["Status",project.status||"Ongoing"],
        ["Client",project.client||"—"],
        ["Architect",project.architect||"—"],
        ["Start Date",project.startDate||"—"],
        ["Planned Completion",project.plannedCompletionDate||project.endDate||"—"]
      ].map(([k,v],i)=><div key={k} style={{padding:"11px 12px",borderRight:i%4===3?"none":`1px solid ${T.line}`,borderBottom:i<4?`1px solid ${T.line}`:"none"}}>
        <div style={{fontFamily:FONT_MONO,fontSize:8,color:T.inkDim,letterSpacing:.8,textTransform:"uppercase"}}>{k}</div>
        <div style={{fontFamily:FONT_BODY,fontSize:12,fontWeight:600,color:T.ink,marginTop:4}}>{v}</div>
      </div>)}
    </div>

    <div style={{border:`1px solid ${T.line}`,background:"#fff"}}>
      <div style={{padding:"10px 12px",background:"#D2CDC1",color:"#1C1C19",borderBottom:`2px solid ${T.ink}`,fontFamily:FONT_MONO,fontSize:9,fontWeight:700,letterSpacing:.8}}>
        PROJECT SCOPE
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(105px,1fr))"}}>
        {scopeFields.map(([label,key],i)=>{
          const checked=Boolean(scope[key]);
          return <button key={key} onClick={()=>updateScope(key,!checked)} style={{border:0,borderRight:`1px solid ${T.line}`,borderBottom:`1px solid ${T.line}`,background:checked?"#E8F2E9":"#FAF9F5",padding:"12px 8px",cursor:"pointer",fontFamily:FONT_BODY,color:checked?"#245C2B":T.inkDim,textAlign:"center"}}>
            <div style={{fontSize:17,fontWeight:800}}>{checked?"☑":"☐"}</div>
            <div style={{fontSize:10,fontWeight:600,marginTop:4}}>{label}</div>
          </button>;
        })}
      </div>
    </div>

    {(project.blocker||project.delayReason)&&<div style={{marginTop:14,border:`1px solid ${T.line}`,background:"#FFF4D6",padding:"11px 12px"}}>
      <div style={{fontFamily:FONT_MONO,fontSize:8,fontWeight:700,color:"#7A5A00"}}>BLOCKER / DELAY</div>
      <div style={{fontFamily:FONT_BODY,fontSize:11,marginTop:4,color:T.ink}}>{project.blocker||project.delayReason}</div>
    </div>}
  </div>;
}



function InlineProjectScope({project,state,persist}){
  const fields=[["Basement","basement"],["Stilt Floor","stiltFloor"],["GF","gf"],["1F","f1"],["2F","f2"],["3F","f3"],["Terrace","terrace"],["Facade","facade"],["Wall Elev.","wallElevation"],["Landscape","landscape"],["Bath Elev.","bathElevation"],["Wardrobe","wardrobe"],["Kitchen","kitchen"],["Onboarding","onboarding"]];
  const toggle=async(key,e)=>{
    e&&e.stopPropagation();
    const projects=state.projects.map(p=>p.id===project.id?{...p,scope:{...(p.scope||{}),[key]:!Boolean(p.scope?.[key])}}:p);
    await persist({...state,projects});
  };
  return <div style={{marginTop:10,paddingTop:9,borderTop:`1px solid ${T.line}`}}>
    <div style={{fontFamily:FONT_MONO,fontSize:8,fontWeight:700,color:T.inkDim,letterSpacing:".08em",marginBottom:6}}>SCOPE OF WORK</div>
    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
      {fields.map(([label,key])=>{const on=Boolean(project.scope?.[key]);return <button key={key} onClick={e=>toggle(key,e)} style={{border:`1px solid ${on?"#7EA986":T.line}`,background:on?"#E8F2E9":"#FAF9F5",color:on?"#245C2B":T.inkDim,padding:"4px 6px",fontFamily:FONT_BODY,fontSize:8,cursor:"pointer",borderRadius:0}}>{on?"☑":"☐"} {label}</button>})}
    </div>
  </div>;
}

function lineOfWorkKind(row){
  return String(row?.milestone||"").trim() ? "execution" : "design";
}
function SplitLineOfWorkView({state,mode}){
  const project=state.projects?.[0];
  if(!project)return <div>No project selected.</div>;
  const all=(project.lineOfWork||state.lineOfWork||[]);
  const rows=all.filter(r=>(!r.projectId||r.projectId===project.id)&&lineOfWorkKind(r)===mode);
  const execution=mode==="execution";
  return <div>
    <h2 style={{fontFamily:FONT_DISPLAY,fontSize:22,margin:"0 0 4px",color:T.ink}}>{execution?"Execution":"Design Line of Work"}</h2>
    <div style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim,marginBottom:16}}>
      {execution?"Milestone onward: site execution, floor/zone, planned dates, status and update ownership.":"Drawing/design portion before Milestone: drawings, tasks, hours, planned dates and responsible person."}
    </div>
    <div style={{border:`1px solid ${T.line}`,background:"#fff",overflowX:"auto"}}>
      <div style={{minWidth:1000}}>
        <div style={{display:"grid",gridTemplateColumns:execution?"55px 1.5fr 1.2fr 110px 120px 130px 140px":"55px 1.4fr 1.6fr 90px 90px 120px 130px 150px",background:"#D2CDC1",color:"#1C1C19",borderBottom:`2px solid ${T.ink}`,fontFamily:FONT_MONO,fontSize:9,fontWeight:700}}>
          {(execution?["SEQ","MILESTONE","FLOOR / ZONE","STATUS","PLANNED START","PLANNED COMPLETION","UPDATED BY"]:["SEQ","DRAWINGS / WORK","TASK","TIME","HOURS","PLANNED START","PLANNED COMPLETION","RESPONSIBLE"]).map(h=><div key={h} style={{padding:8,borderRight:`1px solid ${T.line}`}}>{h}</div>)}
        </div>
        {rows.length?rows.map((r,i)=><div key={r.id||i} style={{display:"grid",gridTemplateColumns:execution?"55px 1.5fr 1.2fr 110px 120px 130px 140px":"55px 1.4fr 1.6fr 90px 90px 120px 130px 150px",borderBottom:`1px solid ${T.line}`,fontFamily:FONT_BODY,fontSize:10}}>
          {(execution?[r.sequence||i+1,r.milestone||"—",r.floorZone||r.zone||"—",r.milestoneStatus||r.status||"Not Started",r.plannedStartDate||"—",r.plannedCompletionDate||"—",r.milestoneUpdatedBy||r.updatedBy||"—"]:[r.sequence||i+1,r.drawings||r.drawing||r.work||"—",r.task||"—",r.time||"—",r.hours||r.plannedHours||"—",r.plannedStartDate||"—",r.plannedCompletionDate||"—",r.responsiblePerson||r.assignee||"—"]).map((v,j)=><div key={j} style={{padding:8,borderRight:`1px solid ${T.line}`}}>{v}</div>)}
        </div>):<div style={{padding:18,fontFamily:FONT_BODY,fontSize:12,color:T.inkDim}}>No {execution?"execution milestone":"design"} rows yet.</div>}
      </div>
    </div>
  </div>;
}
function DesignLineOfWorkView({state}){return <SplitLineOfWorkView state={state} mode="design"/>}
function ExecutionMainView({state,persist}){
  const activeProjects=(state.projects||[]).filter(p=>p.status!=="Completed"&&p.projectControl?.projectStatus!=="Completed");
  const [selectedId,setSelectedId]=useState(activeProjects[0]?.id||"");
  const project=activeProjects.find(p=>p.id===selectedId)||activeProjects[0];
  const [rows,setRows]=useState([]);
  const [updatedBy,setUpdatedBy]=useState("Current User");
  const [updateRole,setUpdateRole]=useState("PMC / Site Supervisor");

  useEffect(()=>{
    if(!project){setRows([]);return;}
    const split=splitDesignExecutionRows(project,state.people||[]);
    setRows(split.execution.map((r,i)=>({...r,id:r.id||uid(),sequence:r.sequence||i+1,milestoneStatus:r.milestoneStatus||"Not Started"})));
  },[project?.id]);

  if(!project)return <div style={{fontFamily:FONT_BODY,color:T.inkDim}}>No active project available. Completed projects are excluded from Execution Dashboard.</div>;

  const update=(id,patch)=>setRows(rs=>rs.map(r=>r.id===id?{...r,...patch}:r));
  const stamp=(r,status)=>{
    const now=new Date().toISOString();
    update(r.id,{
      milestoneStatus:status,
      milestoneUpdatedAt:now,
      milestoneUpdatedBy:updatedBy||"Current User",
      milestoneUpdatedRole:updateRole,
      ...(status==="Started"?{milestoneStartedAt:now}:{}),
      ...(status==="Completed"?{milestoneStoppedAt:now}:{})
    });
  };
  const save=async()=>{
    const split=splitDesignExecutionRows(project,state.people||[]);
    const projects=state.projects.map(p=>p.id===project.id?{...p,lineOfWork:[...split.design,...rows]}:p);
    await persist({...state,projects});
  };
  const projectMeetings=(state.meetings||[]).filter(m=>m.projectId===project.id);

  const updateMeeting=async(id,patch)=>{
    await persist({...state,meetings:(state.meetings||[]).map(m=>m.id===id?{...m,...patch,updatedAt:new Date().toISOString()}:m)});
  };

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:12,marginBottom:16,flexWrap:"wrap"}}>
      <div><h2 style={{fontFamily:FONT_DISPLAY,fontSize:22,margin:0,color:T.ink}}>Execution Dashboard</h2>
      <div style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim,marginTop:4}}>
        Milestone onward only · site execution, planned dates, status, visits and MOM.
      </div></div>
      <Btn onClick={save}><ClipboardCheck size={14}/> Save Execution</Btn>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr 1fr",gap:10,marginBottom:14}}>
      <Field label="Project"><select value={project.id} onChange={e=>setSelectedId(e.target.value)} style={{...inputStyle,borderRadius:0}}>{activeProjects.map(p=><option key={p.id} value={p.id}>{p.no||"—"} · {p.name}</option>)}</select></Field>
      <Field label="Updated by"><input value={updatedBy} onChange={e=>setUpdatedBy(e.target.value)} style={{...inputStyle,borderRadius:0}}/></Field>
      <Field label="Update role"><select value={updateRole} onChange={e=>setUpdateRole(e.target.value)} style={{...inputStyle,borderRadius:0}}><option>PMC / Site Supervisor</option><option>Architect Team</option><option>Our Team</option></select></Field>
    </div>

    <div style={{fontFamily:FONT_MONO,fontSize:10,fontWeight:700,letterSpacing:".08em",margin:"18px 0 8px"}}>EXECUTION MILESTONES</div>
    <div style={{overflowX:"auto",border:`1px solid ${T.ink}`,background:"#fff"}}>
      <table style={{borderCollapse:"collapse",width:"100%",minWidth:1350}}>
        <thead><tr>{["Seq","Milestone","Task / Work","Floor / Zone","Planned Start","Planned Completion","Status","Visits","Visit By","Last Updated"].map(h=><th key={h} style={{...thStyle,background:"#D7D4CC",color:"#111",borderBottom:`2px solid ${T.ink}`,borderRight:`1px solid #B8B5AC`,padding:"10px 8px",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r,i)=><tr key={r.id}>
          <td style={tdStyle}>{r.sequence||i+1}</td>
          <td style={{...tdStyle,minWidth:220}}><input value={r.milestone||""} onChange={e=>update(r.id,{milestone:e.target.value})} style={{...inputStyle,borderRadius:0}}/></td>
          <td style={{...tdStyle,minWidth:240}}><textarea value={r.tasks||""} onChange={e=>update(r.id,{tasks:e.target.value})} style={{...inputStyle,borderRadius:0,resize:"vertical",minHeight:38}}/></td>
          <td style={{...tdStyle,minWidth:145}}><input value={r.floorZone||r.floor||""} onChange={e=>update(r.id,{floorZone:e.target.value,floor:e.target.value})} style={{...inputStyle,borderRadius:0}} placeholder="GF / 1F / Zone"/></td>
          <td style={{...tdStyle,minWidth:145}}><input type="date" value={r.plannedStartDate||""} onChange={e=>update(r.id,{plannedStartDate:e.target.value})} style={{...inputStyle,borderRadius:0}}/></td>
          <td style={{...tdStyle,minWidth:155}}><input type="date" value={r.plannedCompletionDate||""} onChange={e=>update(r.id,{plannedCompletionDate:e.target.value})} style={{...inputStyle,borderRadius:0}}/></td>
          <td style={{...tdStyle,minWidth:220}}><div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontFamily:FONT_MONO,fontSize:9,fontWeight:700}}>{r.milestoneStatus||"Not Started"}</span>
            {(r.milestoneStatus||"Not Started")!=="Started"&&(r.milestoneStatus||"Not Started")!=="Completed"&&<button onClick={()=>stamp(r,"Started")} style={{...smallBtn}}>Start</button>}
            {(r.milestoneStatus==="Started"||r.milestoneStatus==="In Progress")&&<button onClick={()=>stamp(r,"Completed")} style={{...smallBtn,background:T.ink,color:"#fff"}}>Stop / Complete</button>}
            {r.milestoneStatus==="Completed"&&<button onClick={()=>stamp(r,"Started")} style={{...smallBtn}}>Restart</button>}
          </div></td>
          <td style={{...tdStyle,minWidth:145}}><input value={r.visits||""} onChange={e=>update(r.id,{visits:e.target.value})} style={{...inputStyle,borderRadius:0}}/></td>
          <td style={{...tdStyle,minWidth:145}}><input value={r.visitBy||""} onChange={e=>update(r.id,{visitBy:e.target.value})} style={{...inputStyle,borderRadius:0}}/></td>
          <td style={{...tdStyle,minWidth:215,fontFamily:FONT_MONO,fontSize:9}}>{r.milestoneUpdatedAt?`${new Date(r.milestoneUpdatedAt).toLocaleString()} · ${r.milestoneUpdatedBy||"—"}`:"Not updated"}</td>
        </tr>)}</tbody>
      </table>
    </div>

    <div style={{fontFamily:FONT_MONO,fontSize:10,fontWeight:700,letterSpacing:".08em",margin:"24px 0 8px"}}>MEETING MOM REGISTER</div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {projectMeetings.map(m=><div key={m.id} style={{background:"#fff",border:`1px solid ${T.line}`,padding:13}}>
        <div style={{display:"grid",gridTemplateColumns:"1.5fr .8fr .8fr",gap:10,alignItems:"start"}}>
          <div><div style={{fontFamily:FONT_DISPLAY,fontSize:14,fontWeight:700}}>{m.title}</div><div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim,marginTop:3}}>{m.date} {m.time} · {m.location||"—"}</div></div>
          <div style={{fontFamily:FONT_BODY,fontSize:11}}>{m.participants||"—"}</div>
          <div style={{fontFamily:FONT_MONO,fontSize:10,color:m.happened?T.green:T.amber}}>{m.happened?"Meeting happened":"Scheduled / pending"}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10,paddingTop:10,borderTop:`1px solid ${T.line}`}}>
          <Field label="MOM"><textarea value={m.mom||""} onChange={e=>updateMeeting(m.id,{mom:e.target.value})} style={{...inputStyle,minHeight:78,borderRadius:0}} placeholder="Minutes / key decisions"/></Field>
          <Field label="Action Items"><textarea value={m.actionItems||""} onChange={e=>updateMeeting(m.id,{actionItems:e.target.value})} style={{...inputStyle,minHeight:78,borderRadius:0}} placeholder="Action · responsible person · due date"/></Field>
        </div>
      </div>)}
      {!projectMeetings.length&&<div style={{padding:18,border:`1px solid ${T.line}`,background:"#fff",fontFamily:FONT_BODY,fontSize:12,color:T.inkDim}}>No meetings for this project yet. Schedule them from Fix Meeting.</div>}
    </div>
  </div>;
}

function ProjectView({ state, persist }) {
  // Fast scope saving: update UI immediately, then combine rapid checkbox
  // changes into one Google Sheets request after a short idle period.
  const scopeSaveTimersRef = useRef({});
  const scopePendingRef = useRef({});
  const [tab, setTab] = useState("list");
  const [selectedId, setSelectedId] = useState(state.projects[0]?.id || null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [editProjectId, setEditProjectId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [isProjectEditorOpen, setIsProjectEditorOpen] = useState(false);
  const project = state.projects.find(p => p.id === selectedId) || state.projects[0];
  const [board, setBoard] = useState(null);

  useEffect(() => {
    setBoard(project?.designExecutionBoard || buildRoomCentricBoard(project));
  }, [project?.id]);

  if (!project && !showNewProject) {
    return <div>No projects yet. Use + New Project to create the first project.</div>;
  }

  const scopeFields = [
    ["Basement","basement"],["Stilt Floor","stilt_floor"],["GF","gf"],["1F","1f"],["2F","2f"],["3F","3f"],
    ["Terrace","terrace"],["Facade","facade"],["Wall Elevation","wall_elevation"],["Landscape","landscape"],
    ["Bath Elevation","bath_elevation"],["Wardrobe","wardrobe"],["Kitchen","kitchen"],["Onboarding","onboarding"]
  ];

  const isCompletedProject = p => (p.status==="Completed" || p.projectControl?.projectStatus==="Completed" || Boolean(p.completedAt));
  const ongoingProjects = state.projects.filter(p=>!isCompletedProject(p));
  const completedProjects = state.projects.filter(isCompletedProject);
  const completeProject = async (p,e) => {
    if(e)e.stopPropagation();
    let completedRow;
    try { completedRow = await projectApi.complete(p.id); }
    catch (err) { alert(`Google Sheets completion failed: ${err?.message || err}`); return; }
    const now=new Date().toISOString();
    const projects=state.projects.map(x=>x.id===p.id?backendProjectToFrontend(completedRow,{
      ...x,status:"Completed",completedAt:now,completedDate:now.slice(0,10),
      projectControl:{...(x.projectControl||{}),projectStatus:"Completed",completedAt:now}
    }):x);
    await persist({...state,projects});
    if(selectedId===p.id){
      const next=projects.find(x=>!(x.status==="Completed"||x.projectControl?.projectStatus==="Completed"));
      if(next)setSelectedId(next.id);
    }
  };

  const deleteProject = async (p,e) => {
    if(e)e.stopPropagation();
    const label=`${p.no||""} · ${p.name||"Project"}`.replace(/^ · /,"");
    if(!window.confirm(`Delete ${label}?\\n\\nThis will delete this exact project and its linked Contacts, Line of Work and Floor / Zone records from Google Sheets.`)) return;
    try {
      await projectApi.delete(p.id);
    } catch (err) {
      alert(`Google Sheets delete failed: ${err?.message || err}`);
      return;
    }
    const projects=state.projects.filter(x=>x.id!==p.id);
    const scopeSheet=(state.scopeSheet||PROJECT_SCOPE_SHEET_ROWS).filter(r=>
      String(r.project||"").trim().toLowerCase()!==String(p.name||"").trim().toLowerCase()
    );
    await persist({...state,projects,scopeSheet});
    if(selectedId===p.id){
      const next=projects.find(x=>!isCompletedProject(x));
      setSelectedId(next?.id||null);
      setIsProjectEditorOpen(false);
    }
  };

  const scopeFor = (p) => {
    const legacy = (state.scopeSheet || PROJECT_SCOPE_SHEET_ROWS).find(
      r => String(r.project||"").trim().toLowerCase() === String(p.name||"").trim().toLowerCase()
    );
    const ps = p.scope || {};
    const hasSheetShape = scopeFields.some(([,key]) => Object.prototype.hasOwnProperty.call(ps,key));
    return hasSheetShape ? ps : (legacy || {
      serial:p.no||"",
      project:p.name||"",
      client:p.client||"",
      architect:p.architect||"",
      basement:false,stilt_floor:false,gf:false,"1f":false,"2f":false,"3f":false,
      terrace:false,facade:false,wall_elevation:false,landscape:false,bath_elevation:false,
      wardrobe:false,kitchen:false,onboarding:false
    });
  };

  useEffect(() => {
    if (!project) return;
    const sc = scopeFor(project);
    setEditProjectId(project.id);
    setEditDraft({
      no: project.no || "",
      name: project.name || "",
      client: project.client || sc.client || "",
      architect: project.architect || sc.architect || "",
      address: project.address || "",
      type: project.type || "Residence",
      startDate: project.startDate || "",
      plannedCompletionDate: project.plannedCompletionDate || project.endDate || "",
      projectStatus: project.projectStatus || project.status || "Ongoing",
      contacts: {
        ...(project.contacts || {}),
        Owner: {
          ...(project.contacts?.Owner || {}),
          name: project.contacts?.Owner?.name || project.client || ""
        },
        Architect: {
          ...(project.contacts?.Architect || {}),
          name: project.contacts?.Architect?.name || project.architect || ""
        }
      }
    });
    setIsProjectEditorOpen(false);
  }, [project?.id]);

  const toggleScope = (p,key,e) => {
    if (e) e.stopPropagation();

    // Always build from the latest pending scope when the user clicks several
    // checkboxes quickly; otherwise use the currently rendered scope.
    const baseRow = scopePendingRef.current[p.id]?.scope || scopeFor(p);
    const nextRow = {
      ...baseRow,
      project:p.name||baseRow.project||"",
      client:p.client||baseRow.client||"",
      architect:p.architect||baseRow.architect||"",
      [key]:!Boolean(baseRow[key])
    };
    const updatedProject = {...p,scope:nextRow};

    // Optimistic UI: checkbox changes immediately. Local state/local storage
    // do not wait for the Apps Script network round-trip.
    const allRows = state.scopeSheet || PROJECT_SCOPE_SHEET_ROWS;
    const exists = allRows.some(r => String(r.project||"").trim().toLowerCase() === String(p.name||"").trim().toLowerCase());
    const scopeSheet = exists
      ? allRows.map(r => String(r.project||"").trim().toLowerCase() === String(p.name||"").trim().toLowerCase() ? nextRow : r)
      : [...allRows,nextRow];
    const projects = state.projects.map(x => x.id===p.id ? updatedProject : x);
    persist({...state,projects,scopeSheet});

    // Keep the newest project snapshot for this project's eventual save.
    scopePendingRef.current[p.id] = {project: updatedProject, scope: nextRow};

    // Debounce: rapid checkbox clicks become one Google Sheets API update.
    if (scopeSaveTimersRef.current[p.id]) {
      clearTimeout(scopeSaveTimersRef.current[p.id]);
    }
    scopeSaveTimersRef.current[p.id] = setTimeout(async () => {
      const pending = scopePendingRef.current[p.id];
      if (!pending) return;
      try {
        await projectApi.update(frontendProjectToBackend(pending.project, true));
        delete scopePendingRef.current[p.id];
      } catch (err) {
        console.error("Google Sheets scope background save failed:", err);
        // Keep the optimistic selection on screen. The next scope change will
        // retry with the latest complete scope instead of blocking the UI.
      } finally {
        delete scopeSaveTimersRef.current[p.id];
      }
    }, 500);
  };

  const saveProject = async patch => {
    if (!project) return;
    const next={...project,...patch};
    let updatedRow;
    try { updatedRow = await projectApi.update(frontendProjectToBackend(next, true)); }
    catch (err) { alert(`Google Sheets project update failed: ${err?.message || err}`); return; }
    const syncedProject = backendProjectToFrontend(updatedRow, next);
    await persist({...state,projects:state.projects.map(p=>p.id===project.id?syncedProject:p)});
  };

  const openProjectEditor = (p) => {
    const sc = scopeFor(p);
    setSelectedId(p.id);
    setEditProjectId(p.id);
    setIsProjectEditorOpen(true);
    setEditDraft({
      no: p.no || "",
      name: p.name || "",
      client: p.client || sc.client || p.contacts?.Owner?.name || "",
      architect: p.architect || sc.architect || p.contacts?.Architect?.name || "",
      address: p.address || "",
      type: p.type || "Residence",
      startDate: p.startDate || "",
      plannedCompletionDate: p.plannedCompletionDate || p.endDate || "",
      projectStatus: p.projectStatus || p.status || "Ongoing",
      contacts: {
        ...(p.contacts || {}),
        Owner: {
          ...(p.contacts?.Owner || {}),
          name: p.contacts?.Owner?.name || p.client || ""
        },
        Architect: {
          ...(p.contacts?.Architect || {}),
          name: p.contacts?.Architect?.name || p.architect || ""
        }
      }
    });
  };

  const saveProjectEditor = async () => {
    const current = state.projects.find(p => p.id === editProjectId);
    if (!current || !editDraft) return;
    const currentScope = scopeFor(current);
    const cleanContacts = {};
    Object.entries(editDraft.contacts || {}).forEach(([role, c]) => {
      if (c && ((c.name || "").trim() || (c.email || "").trim() || String(c.mobile ?? "").trim())) {
        cleanContacts[role] = {
          name: (c.name || "").trim(),
          email: (c.email || "").trim(),
          mobile: String(c.mobile ?? "").trim()
        };
      }
    });
    const ownerName = (cleanContacts.Owner?.name || editDraft.client || "").trim();
    const architectName = (cleanContacts.Architect?.name || editDraft.architect || "").trim();
    const nextScope = {
      ...currentScope,
      serial: editDraft.no || currentScope.serial || "",
      project: editDraft.name || currentScope.project || "",
      client: ownerName,
      architect: architectName
    };
    const nextProject = {
      ...current,
      no: editDraft.no,
      name: editDraft.name,
      client: ownerName,
      architect: architectName,
      contacts: cleanContacts,
      address: editDraft.address,
      type: editDraft.type,
      startDate: editDraft.startDate,
      plannedCompletionDate: editDraft.plannedCompletionDate,
      endDate: editDraft.plannedCompletionDate,
      projectStatus: editDraft.projectStatus,
      status: editDraft.projectStatus,
      scope: nextScope
    };
    let updatedRow;
    try {
      updatedRow = await projectApi.update(frontendProjectToBackend(nextProject, true));
    } catch (err) {
      alert(`Google Sheets project update failed: ${err?.message || err}`);
      return;
    }
    const syncedProject = backendProjectToFrontend(updatedRow, nextProject);
    if (Object.keys(cleanContacts).length) {
      try { await projectApi.saveContacts(current.id, contactsObjectToRows(syncedProject, cleanContacts)); }
      catch (err) { alert(`Project saved, but Google Sheets contacts failed: ${err?.message || err}`); }
    }
    const allRows = state.scopeSheet || PROJECT_SCOPE_SHEET_ROWS;
    const oldName = String(current.name || "").trim().toLowerCase();
    const scopeSheet = allRows.some(r => String(r.project || "").trim().toLowerCase() === oldName)
      ? allRows.map(r => String(r.project || "").trim().toLowerCase() === oldName ? nextScope : r)
      : [...allRows, nextScope];
    await persist({
      ...state,
      projects: state.projects.map(p => p.id === current.id ? syncedProject : p),
      scopeSheet
    });
    setEditProjectId(syncedProject.id);
    setEditDraft({
      no: syncedProject.no || "",
      name: syncedProject.name || "",
      client: syncedProject.client || nextScope.client || "",
      architect: syncedProject.architect || nextScope.architect || "",
      address: syncedProject.address || "",
      type: syncedProject.type || "Residence",
      startDate: syncedProject.startDate || "",
      plannedCompletionDate: syncedProject.plannedCompletionDate || syncedProject.endDate || "",
      projectStatus: syncedProject.projectStatus || syncedProject.status || "Ongoing",
      contacts: {
        ...(syncedProject.contacts || cleanContacts),
        Owner: {
          ...((syncedProject.contacts || cleanContacts)?.Owner || {}),
          name: (syncedProject.contacts || cleanContacts)?.Owner?.name || syncedProject.client || ownerName || ""
        },
        Architect: {
          ...((syncedProject.contacts || cleanContacts)?.Architect || {}),
          name: (syncedProject.contacts || cleanContacts)?.Architect?.name || syncedProject.architect || architectName || ""
        }
      }
    });
    setIsProjectEditorOpen(false);
  };

  const executionFor=(room)=>{
    const c=room.cells||{};
    return [["Wall Electricals","wallElectrical"],["False Ceiling","falseCeiling"],["RCP / Light","lightDrawings"],["Flooring","layout"],["Elevations","facade"],["Bathroom","bathroom"],["Furniture","furniture"]]
      .map(([name,dep])=>({name,status:c[dep]?.executionStatus||(c[dep]?.received?"Ready":"Blocked"),room}));
  };
  const active=(board?.rooms||[]).flatMap(r=>executionFor(r).filter(x=>x.status==="Ready"||x.status==="In Progress"));

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>
      <div>
        <h2 style={{fontFamily:FONT_DISPLAY,fontSize:22,margin:0,color:T.ink}}>Projects & Scope of Work</h2>
        <div style={{fontFamily:FONT_BODY,fontSize:13,color:T.inkDim,marginTop:4}}>
          One master sheet: project information and project scope are edited together.
        </div>
      </div>
      <button onClick={()=>setShowNewProject(true)} style={{...smallBtn,background:T.navy,color:"#fff",border:`1px solid ${T.navy}`,padding:"9px 13px",fontFamily:FONT_BODY,fontWeight:700,cursor:"pointer"}}>
        + New Project
      </button>
    </div>

    {showNewProject && <div style={{border:`1px solid ${T.line}`,background:"#fff",padding:16,marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontFamily:FONT_DISPLAY,fontSize:16,fontWeight:700}}>New Project</div>
        <button onClick={()=>setShowNewProject(false)} style={{...smallBtn}}>Close</button>
      </div>
      <ProjectOnboarding state={state} persist={persist} selectedId={selectedId} setSelectedId={(id)=>{setSelectedId(id);setShowNewProject(false);setTab("list");}}/>
    </div>}

    <div style={{display:"flex",alignItems:"center",gap:0,borderBottom:`1px solid ${T.line}`,marginBottom:18,overflowX:"auto",background:"#fff"}}>
      {[["list","Projects & Scope"],["team","Teams & Ratings"],["line","Line of Work"]].map(([id,label])=>
        <button type="button" key={id} onClick={(e)=>{e.preventDefault();e.stopPropagation();setTab(id);}} style={{
          padding:"11px 16px",border:"none",borderBottom:`3px solid ${tab===id?T.cyan:"transparent"}`,
          background:tab===id?T.navy:"transparent",color:tab===id?"#fff":T.inkDim,cursor:"pointer",
          fontFamily:FONT_BODY,fontSize:12,fontWeight:tab===id?700:500,whiteSpace:"nowrap"
        }}>{label}</button>
      )}
    </div>

    {tab==="list" && <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,gap:10}}>
        <div style={{fontFamily:FONT_MONO,fontSize:10,letterSpacing:".1em",textTransform:"uppercase",color:T.inkDim}}>Project Master</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {project && !isCompletedProject(project) && <button type="button" onClick={()=>openProjectEditor(project)} style={{...smallBtn,border:`1px solid ${T.blue}`,color:T.blue,background:"#fff"}}>Edit Selected Project</button>}
          <div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim}}>{ongoingProjects.length} ongoing projects</div>
        </div>
      </div>

      <div style={{overflowX:"auto",border:`1px solid ${T.line}`,background:"#fff"}}>
        <div style={{minWidth:1750}}>
          <div style={{
            display:"grid",
            gridTemplateColumns:"65px 300px 180px 180px repeat(14,78px) 105px",
            background:"#D2CDC1",color:"#1C1C19",borderBottom:`2px solid ${T.ink}`,
            fontFamily:FONT_MONO,fontSize:8,fontWeight:700
          }}>
            {["S. No","Current Project","Client","Architect",...scopeFields.map(([label])=>label),"Completed"].map((h,i)=>
              <div key={i} style={{padding:"9px 6px",borderRight:`1px solid ${T.line}`,textAlign:i>=4?"center":"left",display:"flex",alignItems:"center",justifyContent:i>=4?"center":"flex-start"}}>
                {h}
              </div>
            )}
          </div>

          {ongoingProjects.map((p,pi)=>{
            const sc=scopeFor(p);
            const selected=p.id===project?.id;
            return <div key={p.id} onClick={()=>setSelectedId(p.id)} style={{
              display:"grid",gridTemplateColumns:"65px 300px 180px 180px repeat(14,78px) 105px",
              borderBottom:`1px solid ${T.line}`,background:selected?"#F3F1EA":"#fff",cursor:"pointer",
              fontFamily:FONT_BODY,fontSize:10
            }}>
              <div style={{padding:8,borderRight:`1px solid ${T.line}`,fontFamily:FONT_MONO}}>{sc.serial||p.no||pi+1}</div>
              <div style={{padding:8,borderRight:`1px solid ${T.line}`,fontWeight:700,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center"}}>
                <span>{p.name||sc.project||"—"}</span>
                <span style={{display:"flex",gap:5,flexShrink:0}}>
                  <button
                    type="button"
                    onClick={(e)=>{e.stopPropagation();openProjectEditor(p);}}
                    style={{border:`1px solid ${T.blue}`,background:"#fff",color:T.blue,padding:"4px 7px",fontFamily:FONT_MONO,fontSize:8,fontWeight:700,cursor:"pointer"}}
                  >EDIT</button>
                  <button
                    type="button"
                    onClick={(e)=>deleteProject(p,e)}
                    title={`Delete ${p.name}`}
                    style={{border:"1px solid #9B3B35",background:"#fff",color:"#9B3B35",padding:"4px 7px",fontFamily:FONT_MONO,fontSize:8,fontWeight:700,cursor:"pointer"}}
                  >DELETE</button>
                </span>
              </div>
              <div style={{padding:8,borderRight:`1px solid ${T.line}`}}>{p.client||sc.client||"—"}</div>
              <div style={{padding:8,borderRight:`1px solid ${T.line}`}}>{p.architect||sc.architect||"—"}</div>
              {scopeFields.map(([label,key])=>{
                const on=Boolean(sc[key]);
                return <button key={key} onClick={e=>toggleScope(p,key,e)} title={`${label}: ${on?"included":"not included"}`} style={{
                  border:0,borderRight:`1px solid ${T.line}`,background:on?"#E8F2E9":"#FAF9F5",
                  color:on?"#245C2B":"#999",cursor:"pointer",fontSize:16,fontWeight:800
                }}>{on?"☑":"☐"}</button>;
              })}
              <button onClick={e=>completeProject(p,e)} title="Mark project completed" style={{border:0,background:"#FAF9F5",cursor:"pointer",fontFamily:FONT_BODY,fontSize:9,fontWeight:700,color:T.ink}}>
                ☐ Complete
              </button>
            </div>;
          })}
        </div>
      </div>

      {project && editDraft && isProjectEditorOpen && <div style={{marginTop:16,border:`2px solid ${T.navy}`,background:"#fff",padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:14}}>
          <div>
            <div style={{fontFamily:FONT_MONO,fontSize:10,letterSpacing:".1em",textTransform:"uppercase",color:T.cyan}}>Selected Project · Editable Information</div>
            <div style={{fontFamily:FONT_DISPLAY,fontSize:18,fontWeight:700,marginTop:3}}>{editDraft.name || "Selected Project"}</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>openProjectEditor(project)} style={{...smallBtn}}>Reset Form</button>
            <button onClick={()=>setIsProjectEditorOpen(false)} style={{...smallBtn}}>Collapse</button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"140px 1.4fr 1fr 1fr",gap:12}}>
          <Field label="Project No."><input style={{...inputStyle,borderRadius:0}} value={editDraft.no} onChange={e=>setEditDraft(d=>({...d,no:e.target.value}))}/></Field>
          <Field label="Project Name"><input style={{...inputStyle,borderRadius:0}} value={editDraft.name} onChange={e=>setEditDraft(d=>({...d,name:e.target.value}))}/></Field>
          <Field label="Client"><input style={{...inputStyle,borderRadius:0}} value={editDraft.client} onChange={e=>setEditDraft(d=>({...d,client:e.target.value}))}/></Field>
          <Field label="Architect"><input style={{...inputStyle,borderRadius:0}} value={editDraft.architect} onChange={e=>setEditDraft(d=>({...d,architect:e.target.value}))}/></Field>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr 1fr 1fr",gap:12,marginTop:10}}>
          <Field label="Address"><input style={{...inputStyle,borderRadius:0}} value={editDraft.address} onChange={e=>setEditDraft(d=>({...d,address:e.target.value}))}/></Field>
          <Field label="Project Type"><select style={{...inputStyle,borderRadius:0}} value={editDraft.type} onChange={e=>setEditDraft(d=>({...d,type:e.target.value}))}><option>Residence</option><option>Commercial</option><option>Hospitality</option><option>Retail</option><option>Other</option></select></Field>
          <Field label="Start Date"><input type="date" style={{...inputStyle,borderRadius:0}} value={editDraft.startDate} onChange={e=>setEditDraft(d=>({...d,startDate:e.target.value}))}/></Field>
          <Field label="Planned Completion"><input type="date" style={{...inputStyle,borderRadius:0}} value={editDraft.plannedCompletionDate} onChange={e=>setEditDraft(d=>({...d,plannedCompletionDate:e.target.value}))}/></Field>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:12,alignItems:"end",marginTop:10}}>
          <Field label="Project Status"><select style={{...inputStyle,borderRadius:0}} value={editDraft.projectStatus} onChange={e=>setEditDraft(d=>({...d,projectStatus:e.target.value}))}><option>Ongoing</option><option>On Hold</option><option>Completed</option><option>Cancelled</option></select></Field>
          <div style={{display:"flex",gap:8,paddingBottom:1}}>
            <Btn onClick={saveProjectEditor}><ClipboardCheck size={14}/> Save Project</Btn>
            <Btn variant="ghost" onClick={()=>openProjectEditor(project)}>Reset</Btn>
          </div>
        </div>
        <div style={{marginTop:18,paddingTop:14,borderTop:`1px solid ${T.line}`}}>
          <div style={{fontFamily:FONT_MONO,fontSize:10,letterSpacing:".1em",textTransform:"uppercase",color:T.cyan,marginBottom:10}}>Project Contacts · Editable</div>
          <ContactFields
            contacts={editDraft.contacts || {}}
            teamMaster={state.teamMaster || []}
            onChange={(role,field,value)=>setEditDraft(d=>({
              ...d,
              contacts:{...(d.contacts||{}),[role]:{...(d.contacts?.[role]||{}),[field]:value}},
              ...(role==="Owner" && field==="name" ? {client:value} : {}),
              ...(role==="Architect" && field==="name" ? {architect:value} : {})
            }))}
          />
        </div>
        <div style={{fontFamily:FONT_BODY,fontSize:11,color:T.inkDim,marginTop:10}}>Project information and contacts are editable here. Owner name maps to Client and Architect name maps to Architect. Click Save Project after editing. Scope checkboxes remain editable directly in the master row above.</div>
      </div>}

      <div style={{marginTop:22}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontFamily:FONT_MONO,fontSize:10,letterSpacing:".1em",fontWeight:700,color:T.ink}}>COMPLETED PROJECTS</div>
          <div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim}}>{completedProjects.length} completed</div>
        </div>
        <div style={{border:`1px solid ${T.line}`,background:"#fff",overflowX:"auto"}}>
          <div style={{minWidth:850}}>
            <div style={{display:"grid",gridTemplateColumns:"70px 1.5fr 1fr 1fr 130px",background:"#D2CDC1",borderBottom:`2px solid ${T.ink}`,fontFamily:FONT_MONO,fontSize:9,fontWeight:700}}>
              {["S. No","Project","Client","Architect","Completed Date"].map(h=><div key={h} style={{padding:"9px 8px",borderRight:`1px solid ${T.line}`}}>{h}</div>)}
            </div>
            {completedProjects.map((p,i)=><div key={p.id} style={{display:"grid",gridTemplateColumns:"70px 1.5fr 1fr 1fr 130px",borderBottom:`1px solid ${T.line}`,fontFamily:FONT_BODY,fontSize:10,background:"#F7F6F2"}}>
              <div style={{padding:8,borderRight:`1px solid ${T.line}`}}>{p.no||i+1}</div>
              <div style={{padding:8,borderRight:`1px solid ${T.line}`,fontWeight:700}}>{p.name}</div>
              <div style={{padding:8,borderRight:`1px solid ${T.line}`}}>{p.client||"—"}</div>
              <div style={{padding:8,borderRight:`1px solid ${T.line}`}}>{p.architect||"—"}</div>
              <div style={{padding:8,fontFamily:FONT_MONO}}>{p.completedDate||(p.completedAt?String(p.completedAt).slice(0,10):"—")}</div>
            </div>)}
            {!completedProjects.length&&<div style={{padding:14,fontFamily:FONT_BODY,fontSize:11,color:T.inkDim}}>No completed projects yet.</div>}
          </div>
        </div>
      </div>

      {project && !isCompletedProject(project) && <div style={{marginTop:18,borderTop:`2px solid ${T.ink}`,paddingTop:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:10}}>
          <div>
            <div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim,letterSpacing:".08em"}}>SELECTED PROJECT</div>
            <div style={{fontFamily:FONT_DISPLAY,fontSize:18,fontWeight:700}}>{project.name}</div>
          </div>
          <div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim}}>Scope is edited directly in the project master above</div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          <div style={{background:"#fff",border:`1px solid ${T.line}`,padding:12}}>
            <div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim}}>CURRENT STAGE</div>
            <div style={{fontFamily:FONT_DISPLAY,fontSize:16,fontWeight:700,marginTop:5}}>{project.projectControl?.currentStage||project.stage||"Not set"}</div>
          </div>
          <div style={{background:"#fff",border:`1px solid ${T.line}`,padding:12}}>
            <div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim}}>PROJECT STATUS</div>
            <select value={project.projectControl?.projectStatus||project.status||"Ongoing"} onChange={e=>saveProject({
              projectControl:{...(project.projectControl||{}),projectStatus:e.target.value},status:e.target.value
            })} style={{...inputStyle,borderRadius:0,marginTop:4,fontWeight:700}}>
              <option>Ongoing</option><option>On Hold</option><option>Completed</option>
            </select>
          </div>
          <div style={{background:"#fff",border:`1px solid ${T.line}`,padding:12}}>
            <div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim}}>START DATE</div>
            <div style={{fontFamily:FONT_DISPLAY,fontSize:16,fontWeight:700,marginTop:5}}>{project.startDate||project.projectStartDate||"—"}</div>
          </div>
        </div>

        <div style={{marginTop:12}}>
          <div style={{fontFamily:FONT_MONO,fontSize:10,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>What is happening now</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
            {active.slice(0,10).map((x,i)=><div key={i} style={{background:"#fff",border:`1px solid ${T.line}`,borderRadius:0,padding:12}}>
              <strong>{x.name}</strong> · {x.room.area}
              <div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim,marginTop:4}}>{x.status} · {x.room.flr}</div>
            </div>)}
            {active.length===0&&<div style={{color:T.inkDim,fontFamily:FONT_BODY,fontSize:13}}>No active execution items yet.</div>}
          </div>
        </div>
      </div>}
    </div>}

    {tab==="team"&&<ProjectTeamView state={state} persist={persist} selectedId={selectedId}/>}
    {tab==="line"&&<ProjectLineOfWorkView state={state} persist={persist} selectedId={selectedId || null} />}
  </div>;
}

function buildRoomCentricBoard(project) {
  const rows = [
    ["A","GF","Lobby"],["B","GF","Family Lounge"],["C","GF","Powder RM"],["D","GF","Daughter's Bedroom -2"],["E","GF","Daughter's Bathroom -2"],["F","GF","Kitchen"],["G","GF","Utility"],["H","GF","Daughter's Bedroom -1"],["I","GF","Daughter's Bathroom -1"],["J","GF","Sisterinlaw's Bedroom"],["K","GF","Sisterinlaw's Dresser"],["L","GF","Sisterinlaw's Bathroom"],["M","GF","Dinning & Drawing"],["N","GF","Balcony"],["O","GF","Front Balcony"],["P","GF","Back Balcony"],["Q","GF","Staircase"],["R","1F","Lobby & Family Lounge"],["S","1F","Drawing Room"],["T","1F","Bedroom -02"],["U","1F","Washroom"],["V","1F","Temple"],["W","1F","Kitchen"],["X","1F","Utility"],["Y","1F","Bedroom -01"],["Z","1F","Dress & Toilet"],["AA","1F","Powder Toilet"],["AB","1F","Master Bedroom"],["AC","1F","Dresser & Bathroom"],["AD","1F","Back Balcony"],["AE","1F","Front Balcony"]
  ];
  const cells={};
  const makeCell=()=>({received:false,status:"Not Started",executionStatus:"Blocked",reference:"",plannedStart:"",plannedCompletion:"",startedAt:"",completedAt:"",updatedAt:"",updatedBy:""});
  const cols=["layoutReceived","threeD","layout","wallElectrical","falseCeiling","lightDrawings","slabElectrical","facade","bathroom","documentation","furniture"];
  return {rooms:rows.map(([cn,flr,area])=>({id:uid(),cn,flr,area,cells:Object.fromEntries(cols.map(k=>[k,makeCell()]))})), updatedAt:new Date().toISOString(), projectId:project?.id};
}

/* ---------------------------------------------------------------
   VIEW: DIRECTORY — auto-generated from every project's contacts.
   Every named person across every profile is de-duplicated and
   rolled up here with their role(s) and the projects they've been
   on — nothing here is entered by hand.
--------------------------------------------------------------- */
function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2 }} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} onMouseEnter={() => setHover(n)} onClick={() => onChange(n === value ? 0 : n)}
          style={{ cursor: "pointer", fontSize: 15, lineHeight: 1, color: (hover || value) >= n ? T.amber : T.line }}>
          ★
        </span>
      ))}
    </div>
  );
}

function DirectoryView({ state, persist }) {
  const [roleFilter, setRoleFilter] = useState("All");
  const [noteDrafts, setNoteDrafts] = useState({});
  const directory = buildDirectory(state.projects, state.ratings);
  const rolesPresent = Array.from(new Set(directory.flatMap((d) => d.roles)));
  const filtered = roleFilter === "All" ? directory : directory.filter((d) => d.roles.includes(roleFilter));

  const rate = async (key, rating) => {
    const nextRatings = { ...(state.ratings || {}), [key]: { ...(state.ratings?.[key] || {}), rating } };
    await persist({ ...state, ratings: nextRatings });
  };
  const saveNote = async (key) => {
    const note = noteDrafts[key];
    if (note === undefined) return;
    const nextRatings = { ...(state.ratings || {}), [key]: { ...(state.ratings?.[key] || {}), note } };
    await persist({ ...state, ratings: nextRatings });
  };

  return (
    <div>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, margin: "4px 0 4px", color: T.ink }}>Directory</h2>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.inkDim, marginBottom: 16 }}>Auto-built from every project's contacts — every vendor, contractor, architect, and designer you've worked with, deduplicated, with what they've worked on. Rate and leave a testimonial once you've finished working with them.</div>
      <div style={{ marginBottom: 16 }}>
        <Chip active={roleFilter === "All"} onClick={() => setRoleFilter("All")}>All ({directory.length})</Chip>
        {rolesPresent.map((r) => <Chip key={r} active={roleFilter === r} onClick={() => setRoleFilter(r)}>{r}</Chip>)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((d) => (
          <div key={d.key} style={{ background: "#fff", border: `1px solid ${T.line}`, borderRadius: 8, padding: "12px 16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.5fr 110px", gap: 12, alignItems: "start" }}>
              <div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: T.ink }}>{d.name}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: T.blue, marginTop: 2 }}>{d.mobile || "—"}</div>
                {d.email && <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: T.inkDim, marginTop: 1 }}>{d.email}</div>}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {d.roles.map((r) => (
                  <span key={r} style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.inkDim, background: T.paperDim, padding: "2px 7px", borderRadius: 10 }}>{r}</span>
                ))}
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: T.inkDim }}>
                {d.projects.map((p, i) => (
                  <span key={p.id}>
                    <Dot c={statusColor(p.status || "Ongoing").fg} />{p.name}{i < d.projects.length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>
              <div>
                <StarRating value={d.rating} onChange={(v) => rate(d.key, v)} />
              </div>
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.paperDim}` }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: T.inkDim, marginBottom: 5 }}>Testimonial</div>
              <textarea
                value={noteDrafts[d.key] !== undefined ? noteDrafts[d.key] : d.note}
                onChange={(e) => setNoteDrafts((n) => ({ ...n, [d.key]: e.target.value }))}
                onBlur={() => saveNote(d.key)}
                placeholder="How was working with them — quality, reliability, would you use them again?"
                style={{ ...inputStyle, minHeight: 50, resize: "vertical", fontSize: 12.5, padding: "8px 10px" }}
              />
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ color: T.inkDim, fontFamily: FONT_BODY, fontSize: 13 }}>No contacts on file for this role yet.</div>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   VIEW: SETTINGS (task templates / people — editable "sequence")
--------------------------------------------------------------- */
/* ---------------------------------------------------------------
   VIEW: MEETINGS — schedule + happened status + MOM
--------------------------------------------------------------- */
function MeetingsView({ state, persist }) {
  const activeProjects=(state.projects||[]).filter(p=>p.status!=="Completed"&&p.projectControl?.projectStatus!=="Completed");
  const [form,setForm]=useState({projectId:activeProjects[0]?.id||"",date:todayISO(),time:"10:00",title:"",participants:"",location:"",agenda:"",happened:false,mom:"",actionItems:"",nextDate:""});
  const [openMomId,setOpenMomId]=useState(null);
  const projectName=id=>state.projects.find(p=>p.id===id)?.name||"—";

  const addMeeting=async()=>{
    if(!form.title.trim())return;
    const meeting={id:uid(),...form,title:form.title.trim(),createdAt:new Date().toISOString()};
    await persist({...state,meetings:[meeting,...(state.meetings||[])]});
    setForm({...form,title:"",agenda:"",participants:"",location:"",happened:false,nextDate:""});
  };
  const updateMeeting=async(id,patch)=>await persist({...state,meetings:(state.meetings||[]).map(m=>m.id===id?{...m,...patch,updatedAt:new Date().toISOString()}:m)});
  const removeMeeting=async id=>await persist({...state,meetings:(state.meetings||[]).filter(m=>m.id!==id)});

  const nowKey=new Date().toISOString().slice(0,10);
  const meetings=[...(state.meetings||[])].sort((a,b)=>`${b.date||""} ${b.time||""}`.localeCompare(`${a.date||""} ${a.time||""}`));
  const upcoming=meetings.filter(m=>!m.happened&&(m.date||"")>=nowKey);
  const past=meetings.filter(m=>m.happened||(m.date||"")<nowKey);

  return <div>
    <div style={{marginBottom:18}}><h2 style={{fontFamily:FONT_DISPLAY,fontSize:20,margin:0,color:T.ink}}>Fix Meeting</h2><div style={{fontFamily:FONT_BODY,fontSize:13,color:T.inkDim,marginTop:4}}>Schedule meetings here. MOM is maintained in Execution Dashboard, but past MOM can be opened from this history.</div></div>

    <div style={{background:"#fff",border:`1px solid ${T.line}`,padding:16,marginBottom:22}}>
      <div style={{fontFamily:FONT_MONO,fontSize:11,letterSpacing:".08em",textTransform:"uppercase",color:T.inkDim,marginBottom:12}}>Fix a Meeting</div>
      <div style={{display:"grid",gridTemplateColumns:"1.2fr .8fr .7fr",gap:12}}>
        <Field label="Project"><select style={{...inputStyle,borderRadius:0}} value={form.projectId} onChange={e=>setForm({...form,projectId:e.target.value})}>{activeProjects.map(p=><option key={p.id} value={p.id}>{p.no} — {p.name}</option>)}</select></Field>
        <Field label="Date"><input type="date" style={{...inputStyle,borderRadius:0}} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></Field>
        <Field label="Time"><input type="time" style={{...inputStyle,borderRadius:0}} value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></Field>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr 1fr",gap:12}}>
        <Field label="Meeting / Subject"><input style={{...inputStyle,borderRadius:0}} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></Field>
        <Field label="Participants"><input style={{...inputStyle,borderRadius:0}} value={form.participants} onChange={e=>setForm({...form,participants:e.target.value})}/></Field>
        <Field label="Location / Link"><input style={{...inputStyle,borderRadius:0}} value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></Field>
      </div>
      <Field label="Agenda"><textarea style={{...inputStyle,minHeight:60,borderRadius:0}} value={form.agenda} onChange={e=>setForm({...form,agenda:e.target.value})}/></Field>
      <Btn onClick={addMeeting} disabled={!form.title.trim()}><CalendarDays size={14}/> Fix Meeting</Btn>
    </div>

    <div style={{fontFamily:FONT_MONO,fontSize:10,fontWeight:700,letterSpacing:".08em",marginBottom:8}}>UPCOMING / SCHEDULED</div>
    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
      {upcoming.map(m=><div key={m.id} style={{background:"#fff",border:`1px solid ${T.line}`,padding:12}}>
        <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr auto auto",gap:10,alignItems:"center"}}>
          <div><strong style={{fontFamily:FONT_DISPLAY,fontSize:14}}>{m.title}</strong><div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim,marginTop:3}}>{projectName(m.projectId)} · {m.date} {m.time} · {m.location||"—"}</div></div>
          <div style={{fontFamily:FONT_BODY,fontSize:11,color:T.inkDim}}>{m.participants||"—"}</div>
          <button onClick={()=>updateMeeting(m.id,{happened:true})} style={{...smallBtn}}>Mark Happened</button>
          <button onClick={()=>removeMeeting(m.id)} style={{border:"none",background:"transparent",cursor:"pointer"}}><X size={14} color={T.inkDim}/></button>
        </div>
      </div>)}
      {!upcoming.length&&<div style={{padding:14,border:`1px solid ${T.line}`,background:"#fff",fontFamily:FONT_BODY,fontSize:12,color:T.inkDim}}>No upcoming meetings.</div>}
    </div>

    <div style={{fontFamily:FONT_MONO,fontSize:10,fontWeight:700,letterSpacing:".08em",marginBottom:8}}>PAST MEETINGS</div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {past.map(m=><div key={m.id} style={{background:"#fff",border:`1px solid ${T.line}`,padding:12}}>
        <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr auto",gap:10,alignItems:"center"}}>
          <div><strong style={{fontFamily:FONT_DISPLAY,fontSize:14}}>{m.title}</strong><div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim,marginTop:3}}>{projectName(m.projectId)} · {m.date} {m.time}</div></div>
          <div style={{fontFamily:FONT_BODY,fontSize:11,color:T.inkDim}}>{m.participants||"—"}</div>
          <button onClick={()=>setOpenMomId(openMomId===m.id?null:m.id)} style={{...smallBtn}}>{openMomId===m.id?"Hide MOM":"View MOM"}</button>
        </div>
        {openMomId===m.id&&<div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${T.line}`,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><div style={{fontFamily:FONT_MONO,fontSize:9,fontWeight:700,marginBottom:5}}>MOM</div><div style={{fontFamily:FONT_BODY,fontSize:11,lineHeight:1.5,whiteSpace:"pre-wrap"}}>{m.mom||"No MOM entered yet. Open Execution Dashboard to add it."}</div></div>
          <div><div style={{fontFamily:FONT_MONO,fontSize:9,fontWeight:700,marginBottom:5}}>ACTION ITEMS</div><div style={{fontFamily:FONT_BODY,fontSize:11,lineHeight:1.5,whiteSpace:"pre-wrap"}}>{m.actionItems||"—"}</div></div>
        </div>}
      </div>)}
      {!past.length&&<div style={{padding:14,border:`1px solid ${T.line}`,background:"#fff",fontFamily:FONT_BODY,fontSize:12,color:T.inkDim}}>No past meetings yet.</div>}
    </div>
  </div>;
}

/* ---------------------------------------------------------------
   VIEW: SITE PUNCH-IN — attendance + GPS entry/exit
--------------------------------------------------------------- */
function SitePunchInView({ state, persist }) {
  const [projectId, setProjectId] = useState(state.projects[0]?.id || "");
  const [purpose, setPurpose] = useState("");
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationError, setLocationError] = useState("");
  const active = (state.siteVisits || []).find(v => v.person === "Current User" && v.status === "Checked in");
  const projectName = id => state.projects.find(p => p.id === id)?.name || "—";
  const getLocation = () => new Promise((resolve,reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation is not supported by this browser."));
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude:Number(pos.coords.latitude.toFixed(6)), longitude:Number(pos.coords.longitude.toFixed(6)), accuracy:Math.round(pos.coords.accuracy), capturedAt:new Date().toISOString() }),
      err => reject(new Error(err.code === 1 ? "Location permission was denied. Allow location access and try again." : "Unable to capture your current location.")),
      { enableHighAccuracy:true, timeout:15000, maximumAge:0 }
    );
  });
  const checkIn = async () => {
    setLocationBusy(true); setLocationError("");
    try { const loc=await getLocation(); const now=new Date().toISOString(); const visit={id:uid(),person:"Current User",projectId,purpose:purpose.trim(),status:"Checked in",checkInAt:now,checkInLocation:loc,checkOutAt:"",checkOutLocation:null,createdAt:now}; await persist({...state,siteVisits:[visit,...(state.siteVisits||[])]}); setPurpose(""); }
    catch(e){setLocationError(e.message);} finally{setLocationBusy(false);}
  };
  const checkOut = async () => {
    if(!active)return; setLocationBusy(true); setLocationError("");
    try { const loc=await getLocation(); const now=new Date().toISOString(); const next=(state.siteVisits||[]).map(v=>v.id===active.id?{...v,status:"Checked out",checkOutAt:now,checkOutLocation:loc}:v); await persist({...state,siteVisits:next}); }
    catch(e){setLocationError(e.message);} finally{setLocationBusy(false);}
  };
  const fmtStamp=iso=>iso?new Date(iso).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}):"—";
  const mapLink=loc=>loc?`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`:"";
  return <div>
    <div style={{marginBottom:18}}><h2 style={{fontFamily:FONT_DISPLAY,fontSize:20,margin:0,color:T.ink}}>Site Punch-in</h2><div style={{fontFamily:FONT_BODY,fontSize:13,color:T.inkDim,marginTop:4}}>Check in on arrival to mark attendance and punch entry time + GPS. Check out to punch exit time + GPS.</div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,alignItems:"start"}}>
      <div style={{background:"#fff",border:`1px solid ${T.line}`,borderRadius:8,padding:18}}>
        <div style={{fontFamily:FONT_MONO,fontSize:11,letterSpacing:".08em",textTransform:"uppercase",color:T.inkDim,marginBottom:12}}>Current Site Visit</div>
        {!active ? <><Field label="Project"><select style={inputStyle} value={projectId} onChange={e=>setProjectId(e.target.value)}>{state.projects.map(p=><option key={p.id} value={p.id}>{p.no} — {p.name}</option>)}</select></Field>
          <Field label="Visit purpose"><input style={inputStyle} value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="e.g. Site coordination / inspection"/></Field>
          <div style={{background:T.paperDim,border:`1px solid ${T.line}`,borderRadius:6,padding:11,marginBottom:14,fontFamily:FONT_BODY,fontSize:12,color:T.inkDim}}><MapPin size={14} style={{verticalAlign:"middle",marginRight:6}}/>Location permission is required. Latitude, longitude and accuracy are captured only when you press Check In.</div>
          <Btn onClick={checkIn} disabled={locationBusy}><LogIn size={14}/>{locationBusy?"Capturing location…":"Check In & Punch Entry"}</Btn></>
        : <><div style={{background:T.greenBg,border:`1px solid ${T.green}55`,borderRadius:8,padding:14,marginBottom:14}}><div style={{fontFamily:FONT_DISPLAY,fontSize:16,color:T.green}}>Attendance marked — checked in</div><div style={{fontFamily:FONT_MONO,fontSize:11,color:T.inkDim,marginTop:5}}>{projectName(active.projectId)} · {fmtStamp(active.checkInAt)}</div></div>
          <div style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim,marginBottom:14}}>Entry GPS: {active.checkInLocation.latitude}, {active.checkInLocation.longitude} · ±{active.checkInLocation.accuracy}m</div>
          <Btn onClick={checkOut} disabled={locationBusy} variant="dark"><LogOut size={14}/>{locationBusy?"Capturing exit location…":"Check Out & Punch Exit"}</Btn></>}
        {locationError&&<div style={{marginTop:12,background:T.redlineBg,color:T.redline,padding:10,borderRadius:6,fontFamily:FONT_MONO,fontSize:11}}><Navigation size={13} style={{verticalAlign:"middle",marginRight:5}}/>{locationError}</div>}
      </div>
      <div style={{background:"#fff",border:`1px solid ${T.line}`,borderRadius:8,padding:18}}>
        <div style={{fontFamily:FONT_MONO,fontSize:11,letterSpacing:".08em",textTransform:"uppercase",color:T.inkDim,marginBottom:12}}>Attendance / Visit History</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>{(state.siteVisits||[]).slice(0,12).map(v=><div key={v.id} style={{padding:"10px 0",borderBottom:`1px solid ${T.paperDim}`}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:10}}><strong style={{fontFamily:FONT_BODY,fontSize:13}}>{projectName(v.projectId)}</strong><span style={{fontFamily:FONT_MONO,fontSize:10,color:v.status==="Checked out"?T.green:T.amber}}>{v.status}</span></div>
          <div style={{fontFamily:FONT_MONO,fontSize:10.5,color:T.inkDim,marginTop:3}}>IN {fmtStamp(v.checkInAt)} · OUT {fmtStamp(v.checkOutAt)}</div>
          <div style={{fontFamily:FONT_BODY,fontSize:11.5,color:T.inkDim,marginTop:3}}>{v.purpose||"Site visit"}</div>
          <div style={{display:"flex",gap:10,marginTop:5,fontFamily:FONT_MONO,fontSize:10}}>{v.checkInLocation&&<a href={mapLink(v.checkInLocation)} target="_blank" rel="noreferrer" style={{color:T.blue}}>Entry map</a>}{v.checkOutLocation&&<a href={mapLink(v.checkOutLocation)} target="_blank" rel="noreferrer" style={{color:T.blue}}>Exit map</a>}</div>
        </div>)}{(state.siteVisits||[]).length===0&&<div style={{color:T.inkDim,fontFamily:FONT_BODY,fontSize:13}}>No site attendance records yet.</div>}</div>
      </div>
    </div>
  </div>;
}

function SettingsView({ state, persist }) {
  const blankMember = { userId:"", name:"", email:"", mobile:"", role:"", department:"", active:true, appAccess:"User", driveEmail:"" };
  const [members, setMembers] = useState(state.teamMaster || []);
  const [form, setForm] = useState(blankMember);
  const [editingId, setEditingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [departments, setDepartments] = useState(state.departmentMaster || TEAM_DEPARTMENTS.map((name,i)=>({masterId:`DEP-${String(i+1).padStart(3,"0")}`,name,active:true})));
  const [designations, setDesignations] = useState(state.designationMaster || TEAM_DESIGNATIONS.map((name,i)=>({masterId:`ROL-${String(i+1).padStart(3,"0")}`,name,active:true})));
  const [newDepartment, setNewDepartment] = useState("");
  const [newDesignation, setNewDesignation] = useState("");
  const [drawingTemplates, setDrawingTemplates] = useState((state.templates || DEFAULT_TEMPLATES).map((t,i)=>({...t,sequence:t.sequence||i+1,active:t.active!==false,tasks:(t.tasks||[]).map((x,j)=>({...x,sequence:x.sequence||j+1}))})));
  const [masterBusy, setMasterBusy] = useState(false);

  useEffect(()=>{ setMembers(state.teamMaster || []); },[state.teamMaster]);
  useEffect(()=>{ setDepartments(state.departmentMaster || []); },[state.departmentMaster]);
  useEffect(()=>{ setDesignations(state.designationMaster || []); },[state.designationMaster]);
  useEffect(()=>{ setDrawingTemplates((state.templates||DEFAULT_TEMPLATES).map((t,i)=>({...t,sequence:t.sequence||i+1,active:t.active!==false,tasks:(t.tasks||[]).map((x,j)=>({...x,sequence:x.sequence||j+1}))}))); },[state.templates]);

  const activeDepartments = departments.filter(x=>x.active!==false && String(x.active).toLowerCase()!=="false");
  const activeDesignations = designations.filter(x=>x.active!==false && String(x.active).toLowerCase()!=="false");

  const saveMaster = async (kind, item) => {
    setBusy(true); setMessage("");
    try {
      const result = kind==="department" ? await projectApi.saveDepartment(item) : await projectApi.saveDesignation(item);
      const saved = result?.item || result;
      const current = kind==="department" ? departments : designations;
      const next = current.some(x=>x.masterId===saved.masterId) ? current.map(x=>x.masterId===saved.masterId?saved:x) : [...current,saved];
      if(kind==="department") setDepartments(next); else setDesignations(next);
      await persist({...state, [kind==="department"?"departmentMaster":"designationMaster"]:next,
        teamMaster: members.map(m => kind==="department" && result?.oldName && m.department===result.oldName ? {...m,department:saved.name} :
          kind==="designation" && result?.oldName && m.role===result.oldName ? {...m,role:saved.name} : m)});
      setMessage(`${kind==="department"?"Department":"Designation / Role"} saved and synced.`);
    } catch(e){ setMessage(e.message || "Master save failed."); } finally { setBusy(false); }
  };
  const addMaster = async kind => {
    const name=(kind==="department"?newDepartment:newDesignation).trim(); if(!name) return;
    await saveMaster(kind,{name,active:true});
    if(kind==="department") setNewDepartment(""); else setNewDesignation("");
  };
  const renameMaster = async (kind,item) => {
    const name=window.prompt(`Rename ${kind==="department"?"department":"designation / role"}`,item.name);
    if(!name || name.trim()===item.name) return;
    await saveMaster(kind,{...item,name:name.trim()});
  };
  const toggleMaster = async (kind,item) => saveMaster(kind,{...item,active:!(item.active!==false && String(item.active).toLowerCase()!=="false")});
  const syncState = async nextMembers => {
    const names = nextMembers.filter(m => m.active !== false && String(m.active).toLowerCase() !== "false").map(m=>m.name).filter(Boolean);
    await persist({...state, teamMaster:nextMembers, people:names});
  };
  const saveMember = async () => {
    if(!form.name.trim()) return setMessage("Name is required.");
    setBusy(true); setMessage("");
    try {
      const saved = await projectApi.saveTeamMember({...form, userId:editingId || form.userId});
      const row = saved?.member || saved || {...form,userId:editingId||form.userId};
      const next = editingId ? members.map(m=>m.userId===editingId?row:m) : [...members,row];
      setMembers(next); await syncState(next); setForm(blankMember); setEditingId(""); setMessage("Team member saved to Google Sheet.");
    } catch(e){ setMessage(e.message || "Could not save team member."); } finally { setBusy(false); }
  };
  const editMember = m => { setEditingId(m.userId); setForm({...blankMember,...m,active:m.active!==false && String(m.active).toLowerCase()!=="false"}); window.scrollTo({top:0,behavior:"smooth"}); };
  const removeMember = async m => {
    if(!window.confirm(`Delete ${m.name} from Team Master?`)) return;
    setBusy(true); try { await projectApi.deleteTeamMember(m.userId); const next=members.filter(x=>x.userId!==m.userId); setMembers(next); await syncState(next); setMessage("Team member deleted from Google Sheet."); } catch(e){setMessage(e.message||"Delete failed.");} finally{setBusy(false);}
  };
  const saveDrawingMaster = async (next=drawingTemplates) => {
    const clean=next.map((t,i)=>({...t,drawingType:String(t.drawingType||"").trim(),sequence:i+1,active:t.active!==false,tasks:(t.tasks||[]).filter(x=>String(x.title||"").trim()).map((x,j)=>({...x,title:String(x.title||"").trim(),sequence:j+1}))})).filter(t=>t.drawingType);
    setMasterBusy(true); setMessage("");
    try { const saved=await projectApi.saveDrawingTaskMaster(clean); const finalRows=Array.isArray(saved?.templates)?saved.templates:clean; setDrawingTemplates(finalRows); await persist({...state,templates:finalRows}); setMessage("Drawing type & task sequence saved. Received Upload, Classify, task creation, WIH and assignment now use this master."); }
    catch(e){ setMessage(e.message||"Drawing master save failed."); } finally { setMasterBusy(false); }
  };
  const addDrawingType=()=>setDrawingTemplates(x=>[...x,{drawingType:"New Drawing Type",active:true,sequence:x.length+1,tasks:[]}]);
  const deleteDrawingType=i=>{ if(window.confirm("Delete this drawing type from new workflow selections? Existing history will remain unchanged.")) setDrawingTemplates(x=>x.filter((_,j)=>j!==i)); };
  const moveDrawingType=(i,d)=>setDrawingTemplates(x=>{const n=[...x],j=i+d;if(j<0||j>=n.length)return n;[n[i],n[j]]=[n[j],n[i]];return n;});
  const patchDrawingType=(i,patch)=>setDrawingTemplates(x=>x.map((t,j)=>j===i?{...t,...patch}:t));
  const addDrawingTask=i=>setDrawingTemplates(x=>x.map((t,j)=>j===i?{...t,tasks:[...(t.tasks||[]),{title:"New Task",assignee:"",sequence:(t.tasks||[]).length+1}]}:t));
  const patchDrawingTask=(i,k,patch)=>setDrawingTemplates(x=>x.map((t,j)=>j===i?{...t,tasks:(t.tasks||[]).map((a,b)=>b===k?{...a,...patch}:a)}:t));
  const deleteDrawingTask=(i,k)=>setDrawingTemplates(x=>x.map((t,j)=>j===i?{...t,tasks:(t.tasks||[]).filter((_,b)=>b!==k)}:t));
  const moveDrawingTask=(i,k,d)=>setDrawingTemplates(x=>x.map((t,j)=>{if(j!==i)return t;const a=[...(t.tasks||[])],z=k+d;if(z<0||z>=a.length)return t;[a[k],a[z]]=[a[z],a[k]];return {...t,tasks:a};}));
  const set = (k,v)=>setForm(f=>({...f,[k]:v}));
  return <div>
    <div style={{marginBottom:20}}><h2 style={{fontFamily:FONT_DISPLAY,fontSize:24,margin:"0 0 5px"}}>Team Master</h2><div style={{fontFamily:FONT_BODY,fontSize:13,color:T.inkDim}}>Enter each employee once. The Gmail ID is the login identity. Set <b>App Access = Admin</b> for administrators; active team members automatically become selectable in Responsible Person / Assignee dropdowns.</div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
      {[["Department Master",departments,newDepartment,setNewDepartment,"department"],["Designation / Role Master",designations,newDesignation,setNewDesignation,"designation"]].map(([title,items,newValue,setNewValue,kind])=>
        <div key={kind} style={{background:"#fff",border:`1px solid ${T.line}`,padding:14}}>
          <div style={{fontFamily:FONT_DISPLAY,fontSize:17,marginBottom:4}}>{title}</div>
          <div style={{fontFamily:FONT_BODY,fontSize:11.5,color:T.inkDim,marginBottom:10}}>Add once. EDIT renames it everywhere in Team Master. INACTIVE keeps old history but removes it from new selections.</div>
          <div style={{display:"flex",gap:7,marginBottom:10}}><input style={inputStyle} value={newValue} onChange={e=>setNewValue(e.target.value)} placeholder={`Add ${kind==="department"?"department":"designation / role"}`}/><button style={smallBtn} onClick={()=>addMaster(kind)}>+ ADD</button></div>
          <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:230,overflowY:"auto"}}>
            {items.map(item=>{const active=item.active!==false&&String(item.active).toLowerCase()!=="false";return <div key={item.masterId||item.name} style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:6,alignItems:"center",border:`1px solid ${T.line}`,padding:"7px 8px"}}>
              <span style={{fontFamily:FONT_BODY,fontSize:12,fontWeight:600}}>{item.name}</span>
              <button style={smallBtn} onClick={()=>renameMaster(kind,item)}>EDIT</button>
              <button style={{...smallBtn,color:active?T.redline:T.green}} onClick={()=>toggleMaster(kind,item)}>{active?"INACTIVATE":"ACTIVATE"}</button>
            </div>})}
          </div>
        </div>)}
    </div>
    <div style={{background:"#fff",border:`1px solid ${T.line}`,padding:16,marginBottom:20}}>
      <div style={{fontFamily:FONT_MONO,fontSize:11,fontWeight:700,marginBottom:12}}>{editingId?"EDIT TEAM MEMBER":"ADD TEAM MEMBER"}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(180px,1fr))",gap:12}}>
        <Field label="Employee ID"><input style={inputStyle} value={form.userId||""} disabled={!!editingId} onChange={e=>set("userId",e.target.value)} placeholder="Auto if blank"/></Field>
        <Field label="Name *"><input style={inputStyle} value={form.name||""} onChange={e=>set("name",e.target.value)} placeholder="Team member name"/></Field>
        <Field label="Designation / Role"><select style={inputStyle} value={form.role||""} onChange={e=>set("role",e.target.value)}><option value="">Select designation / role</option>{activeDesignations.map(r=><option key={r.masterId||r.name} value={r.name}>{r.name}</option>)}</select></Field>
        <Field label="Department"><select style={inputStyle} value={form.department||""} onChange={e=>set("department",e.target.value)}><option value="">Select department</option>{activeDepartments.map(d=><option key={d.masterId||d.name} value={d.name}>{d.name}</option>)}</select></Field>
        <Field label="Mobile"><input style={inputStyle} value={form.mobile||""} onChange={e=>set("mobile",e.target.value)} placeholder="Mobile number"/></Field>
        <Field label="Gmail ID (Login Email)"><input type="email" style={inputStyle} value={form.email||""} onChange={e=>set("email",e.target.value)} placeholder="name@gmail.com"/></Field>
        <Field label="Google Drive Email"><input style={inputStyle} value={form.driveEmail||""} onChange={e=>set("driveEmail",e.target.value)} placeholder="Drive sharing email"/></Field>
        <Field label="App Access"><select style={inputStyle} value={form.appAccess||"User"} onChange={e=>set("appAccess",e.target.value)}><option>User</option><option>Admin</option><option>Viewer</option><option>No Access</option></select></Field>
        <Field label="Status"><select style={inputStyle} value={form.active?"Active":"Inactive"} onChange={e=>set("active",e.target.value==="Active")}><option>Active</option><option>Inactive</option></select></Field>
      </div>
      <div style={{display:"flex",gap:8,marginTop:10}}><Btn onClick={saveMember} disabled={busy}>{editingId?"Update Team Member":"Save Team Member"}</Btn>{editingId&&<button style={smallBtn} onClick={()=>{setEditingId("");setForm(blankMember)}}>Cancel</button>}</div>
      {message&&<div style={{fontFamily:FONT_MONO,fontSize:10.5,marginTop:10,color:T.inkDim}}>{message}</div>}
    </div>
    <div style={{overflowX:"auto",background:"#fff",border:`1px solid ${T.line}`,marginBottom:28}}><table style={{width:"100%",borderCollapse:"collapse",fontFamily:FONT_BODY,fontSize:12}}><thead><tr>{["Employee ID","Name","Role","Department","Mobile","Email","Access","Status","Action"].map(h=><th key={h} style={{textAlign:"left",padding:9,borderBottom:`1px solid ${T.ink}`,background:T.paperDim}}>{h}</th>)}</tr></thead><tbody>{members.map(m=><tr key={m.userId}><td style={{padding:9,borderBottom:`1px solid ${T.line}`}}>{m.userId}</td><td style={{padding:9,borderBottom:`1px solid ${T.line}`,fontWeight:700}}>{m.name}</td><td style={{padding:9,borderBottom:`1px solid ${T.line}`}}>{m.role||"—"}</td><td style={{padding:9,borderBottom:`1px solid ${T.line}`}}>{m.department||"—"}</td><td style={{padding:9,borderBottom:`1px solid ${T.line}`}}>{m.mobile||"—"}</td><td style={{padding:9,borderBottom:`1px solid ${T.line}`}}>{m.email||"—"}</td><td style={{padding:9,borderBottom:`1px solid ${T.line}`}}>{m.appAccess||"User"}</td><td style={{padding:9,borderBottom:`1px solid ${T.line}`}}>{m.active!==false&&String(m.active).toLowerCase()!=="false"?"Active":"Inactive"}</td><td style={{padding:9,borderBottom:`1px solid ${T.line}`,whiteSpace:"nowrap"}}><button style={smallBtn} onClick={()=>editMember(m)}>EDIT</button> <button style={{...smallBtn,color:T.redline}} onClick={()=>removeMember(m)}>DELETE</button></td></tr>)}{!members.length&&<tr><td colSpan="9" style={{padding:16,color:T.inkDim}}>No team members yet. Add the first member above.</td></tr>}</tbody></table></div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"4px 0 12px"}}>
      <div><h2 style={{fontFamily:FONT_DISPLAY,fontSize:20,margin:0,color:T.ink}}>Drawing Type & Task Sequence Master <span style={{fontFamily:FONT_MONO,fontSize:11,color:T.green}}>· EDITABLE</span></h2><div style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim,marginTop:4}}>Type directly into the Drawing Type and Task boxes below. Use + ADD DRAWING TYPE / + ADD TASK, arrows to reorder, DELETE to remove, then press SAVE MASTER. Edit once here. New Received Uploads, Classify, task creation, WIH and project-wise assignment use the same master automatically. Existing completed history is not rewritten.</div></div>
      <div style={{display:"flex",gap:8}}><button style={smallBtn} onClick={addDrawingType}>+ ADD DRAWING TYPE</button><button disabled={masterBusy} style={{...smallBtn,background:T.navy,color:"#fff"}} onClick={()=>saveDrawingMaster()}>{masterBusy?"SAVING…":"SAVE MASTER"}</button></div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{drawingTemplates.map((t,i)=><div key={`${t.drawingType}-${i}`} style={{background:"#fff",border:`1px solid ${T.line}`,padding:14}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:6,alignItems:"center",marginBottom:10}}><input style={{...inputStyle,fontWeight:700}} value={t.drawingType} onChange={e=>patchDrawingType(i,{drawingType:e.target.value})}/><button style={smallBtn} onClick={()=>moveDrawingType(i,-1)}>↑</button><button style={smallBtn} onClick={()=>moveDrawingType(i,1)}>↓</button><button style={{...smallBtn,color:T.redline}} onClick={()=>deleteDrawingType(i)}>DELETE</button></div>
      {(t.tasks||[]).map((task,k)=><div key={k} style={{display:"grid",gridTemplateColumns:"1fr 180px auto auto auto",gap:6,alignItems:"center",marginBottom:7}}><input style={inputStyle} value={task.title||""} onChange={e=>patchDrawingTask(i,k,{title:e.target.value})}/><select style={inputStyle} value={task.assignee||""} onChange={e=>patchDrawingTask(i,k,{assignee:e.target.value})}><option value="">Select member</option>{members.filter(m=>m.active!==false&&String(m.active).toLowerCase()!=="false").map(m=><option key={m.userId||m.name} value={m.name}>{m.name}</option>)}</select><button style={smallBtn} onClick={()=>moveDrawingTask(i,k,-1)}>↑</button><button style={smallBtn} onClick={()=>moveDrawingTask(i,k,1)}>↓</button><button style={{...smallBtn,color:T.redline}} onClick={()=>deleteDrawingTask(i,k)}>×</button></div>)}
      <button style={smallBtn} onClick={()=>addDrawingTask(i)}>+ ADD TASK</button>
    </div>)}</div>
  </div>;
}

/* ---------------------------------------------------------------
   APP SHELL
--------------------------------------------------------------- */
const NAV = [
  { id: "project", label: "Project", icon: Building2, group: "PROJECT" },
  { id: "design", label: "Design Dashboard", icon: FileText, group: "PROJECT" },
  { id: "dashboard", label: "Floor / Zone", icon: LayoutGrid, group: "RECEIVED / SENT" },
  { id: "upload", label: "Received · Upload", icon: Upload, group: "RECEIVED / SENT" },
  { id: "classify", label: "Classify", icon: ClipboardCheck, group: "RECEIVED / SENT" },
  { id: "timesheet", label: "WIH Sheet", icon: Clock, group: "WIH SHEET" },
  { id: "meetings", label: "Fix Meeting", icon: CalendarDays, group: "WIH SHEET" },
  { id: "executionMain", label: "Execution Dashboard", icon: HardHat, group: "WIH SHEET" },
  { id: "site", label: "Site Punch-in", icon: MapPin, group: "SITE PUNCH-IN" },
  { id: "settings", label: "Team & Tasks", icon: Settings2, group: "ADMIN" },
];

export default function App() {
  const { state, loading, saveErr, backendErr, currentUser, persist } = useStudioState();
  const [view, setView] = useState("project");

  if (loading || !state) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400, fontFamily: FONT_BODY, color: T.inkDim, gap: 8 }}>
        <Loader2 size={16} className="spin" /> Loading studio data…
        <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (state.accessDenied) {
    return (
      <div style={{ minHeight: 560, background: T.paper, display: "flex", alignItems: "center", justifyContent: "center", padding: 28, fontFamily: FONT_BODY }}>
        <div style={{ width: "min(620px, 94vw)", background: "#fff", border: `1px solid ${T.line}`, borderRadius: 10, padding: 28, boxShadow: "0 10px 30px rgba(8,25,45,.08)" }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: ".12em", color: T.cyan }}>STUDIO TRACKER · ADMIN ACCESS</div>
          <h2 style={{ fontFamily: FONT_DISPLAY, margin: "8px 0 8px", color: T.ink }}>Admin access required</h2>
          <div style={{ color: T.inkDim, fontSize: 13, lineHeight: 1.6 }}>{backendErr || "Your Gmail ID is not authorised for the Admin panel."}</div>
          {currentUser?.email && <div style={{ marginTop: 14, padding: 12, background: T.paperDim, border: `1px solid ${T.line}`, fontFamily: FONT_MONO, fontSize: 12 }}>{currentUser.email}</div>}
          <div style={{ marginTop: 16, fontSize: 12, color: T.inkDim }}>Add this Gmail ID in <b>Team & Tasks → Team Master</b> and set <b>App Access = Admin</b> and <b>Status = Active</b>.</div>
        </div>
      </div>
    );
  }

  const pendingCount = state.intakes.filter((i) => !i.classified).length;
  const viewLabel = NAV.find((n) => n.id === view)?.label;

  return (
    <div style={{ fontFamily: FONT_BODY, background: T.paper, minHeight: 560, display: "flex", borderRadius: 10, overflow: "hidden", border: `1px solid ${T.line}` }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" />

      {/* Sidebar — drawing-set index */}
      <div style={{ width: 210, background: T.navy, color: "#fff", padding: "20px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 20px 20px", borderBottom: `1px solid ${T.cyan}22`, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Building2 size={18} color={T.cyan} />
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14, letterSpacing: "0.02em" }}>Studio Tracker</div>
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.cyan, opacity: 0.7, marginTop: 4 }}>lighting design · intake → task → timesheet</div>
        </div>
        {NAV.map((n, idx) => {
          const Icon = n.icon;
          const active = view === n.id;
          const showGroup = idx === 0 || NAV[idx - 1].group !== n.group;
          return (
            <React.Fragment key={n.id}>
              {showGroup && <div style={{ padding: "10px 20px 5px", fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.12em", color: T.cyan, opacity: 0.6 }}>{n.group}</div>}
            <button key={n.id} onClick={() => setView(n.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 20px",
              background: active ? T.navy2 : "transparent", border: "none",
              borderLeft: `3px solid ${active ? T.cyan : "transparent"}`,
              color: active ? "#fff" : "#B7C4D6", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13,
              textAlign: "left",
            }}>
              <Icon size={15} />
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.id === "classify" && pendingCount > 0 && (
                <span style={{ background: T.amber, color: "#fff", fontSize: 10, fontFamily: FONT_MONO, borderRadius: 10, padding: "1px 6px" }}>{pendingCount}</span>
              )}
              {active && <ChevronRight size={13} />}
            </button>
            </React.Fragment>
          );
        })}
        <div style={{ padding: "20px", marginTop: 20, fontFamily: FONT_MONO, fontSize: 10, color: T.cyan, opacity: 0.7 }}>
          <div style={{ marginBottom: 6 }}>ADMIN · {currentUser?.name || "Admin"}</div>
          <div style={{ opacity: 0.7, wordBreak: "break-all" }}>{currentUser?.email || ""}</div>
          <div style={{ marginTop: 10, opacity: 0.6 }}>enLIGHTen OS · project → scope → team → line of work → WIH</div>
        </div>
      </div>

      {/* Main canvas */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TitleBlock view={viewLabel} sub={view === "timesheet" ? `${state.tasks.length} tasks` : view === "classify" ? `${pendingCount} pending` : view === "project" ? "Onboarding · Scope · Team · Line of Work" : view === "meetings" ? `${(state.meetings || []).length} meetings` : view === "executionMain" ? "Milestones · MOM" : view === "site" ? `${(state.siteVisits || []).length} site visits` : undefined} />
        {saveErr && (
          <div style={{ background: T.redlineBg, color: T.redline, fontFamily: FONT_MONO, fontSize: 12, padding: "8px 24px", display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={13} /> Couldn't save — changes may not persist.
          </div>
        )}
        {backendErr && (
          <div style={{ background: T.amberBg, color: T.amber, fontFamily: FONT_MONO, fontSize: 12, padding: "8px 24px", display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={13} /> Google Sheets backend unavailable — Projects are showing the last local data.
          </div>
        )}
        <div style={{ padding: "28px 32px", overflowY: "auto" }}>
          {view === "project" && <ProjectView state={state} persist={persist} />}
          {view === "designLineOfWork" && <DesignLineOfWorkView state={state} persist={persist} />}
          {view === "design" && <DesignFlowView state={state} persist={persist} />}
          
          {view === "dashboard" && <DashboardView state={state} persist={persist} />}
          {view === "upload" && <UploadView state={state} persist={persist} />}
          {view === "classify" && <ClassifyView state={state} persist={persist} />}
          {view === "timesheet" && <TimesheetView state={state} persist={persist} />}
          {view === "meetings" && <MeetingsView state={state} persist={persist} />}
          {view === "executionMain" && <ExecutionMainView state={state} persist={persist} />}
          {view === "site" && <SitePunchInView state={state} persist={persist} />}
          {view === "settings" && <SettingsView state={state} persist={persist} />}
        </div>
      </div>
    </div>
  );
}
