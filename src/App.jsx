/*
enLIGHTen OS v2.3 — Google Sheets Projects Connected
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
    "silt_floor": true,
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
    "silt_floor": true,
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
    "silt_floor": false,
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
    "silt_floor": true,
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
    "silt_floor": true,
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
    "silt_floor": true,
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
    "silt_floor": true,
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
    "silt_floor": true,
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
    "silt_floor": false,
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
    "silt_floor": true,
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
    "silt_floor": false,
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
    "silt_floor": false,
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
    "silt_floor": false,
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
    "silt_floor": false,
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
    "silt_floor": true,
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
    "silt_floor": false,
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
    "silt_floor": true,
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
    "silt_floor": false,
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
    "silt_floor": false,
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
    "silt_floor": false,
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
    "silt_floor": false,
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
    "silt_floor": false,
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
    "silt_floor": false,
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
    "silt_floor": false,
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
    "silt_floor": false,
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
    "silt_floor": false,
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
    "silt_floor": false,
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
    "silt_floor": false,
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
    "silt_floor": false,
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
    "silt_floor": false,
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

const PROJECT_SCOPE_BOOLEAN_FIELDS = ['Basement', 'Silt Floor', 'GF', '1F', '2F', '3F', 'Terrace', 'Facade', 'Wall Elevation', 'Landscape', 'Bath Elevation', 'Wardrobe', 'Kitchen', 'Onboarding'];


/*
PROJECT SCOPE — EXACT SOURCE STRUCTURE
Source workbook: Scope of work.xlsx
Columns:
S. No | Current Project | Client | Architect | Basement | Silt Floor |
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
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

/* ---------------------------------------------------------------
   GOOGLE APPS SCRIPT API — v2.3 PROJECT CONNECTION
   Phase 1 connects Projects & Scope of Work to Google Sheets.
--------------------------------------------------------------- */
const ENLIGHTEN_API_URL = "https://script.google.com/macros/s/AKfycbzsB8YOAO0J8WY7h7sxThnG9Tz8r-ojaXJbMtPjcfCCQy4t5HVTVLMQKylZPsybHXH8/exec";

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
  const json = await response.json();
  if (!json?.ok) throw new Error(json?.error?.message || `API request failed: ${action}`);
  return json.data;
}

const projectApi = {
  listAll: () => apiRequest("listProjects", { activeOnly: false }, "GET"),
  create: payload => apiRequest("createProject", payload),
  update: payload => apiRequest("updateProject", payload),
  complete: projectId => apiRequest("completeProject", { projectId })
};

function backendProjectToFrontend(row, fallback = {}) {
  const isTrue = v => v === true || String(v).toLowerCase() === "true";
  const scope = {
    ...(fallback.scope || {}),
    serial: row.projectNo || fallback.no || "", project: row.projectName || fallback.name || "",
    client: row.client || fallback.client || "", architect: row.architect || fallback.architect || "",
    basement: isTrue(row.basement), silt_floor: isTrue(row.stiltFloor), gf: isTrue(row.gf),
    "1f": isTrue(row["1f"]), "2f": isTrue(row["2f"]), "3f": isTrue(row["3f"]),
    terrace: isTrue(row.terrace), facade: isTrue(row.facade), wall_elevation: isTrue(row.wallElevation),
    landscape: isTrue(row.landscape), bath_elevation: isTrue(row.bathElevation), wardrobe: isTrue(row.wardrobe),
    kitchen: isTrue(row.kitchen), onboarding: isTrue(row.onboarding)
  };
  const status = row.projectStatus || fallback.status || "Ongoing";
  return {
    ...fallback, id: row.projectId || fallback.id, no: row.projectNo || fallback.no || "",
    name: row.projectName || fallback.name || "", client: row.client || fallback.client || "",
    architect: row.architect || fallback.architect || "", address: row.address || fallback.address || "",
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
    basement: Boolean(s.basement), stiltFloor: Boolean(s.silt_floor), gf: Boolean(s.gf),
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

function normalizeStudioState(base) {
  return {
    projects: base.projects || SEED_PROJECTS,
    people: base.people || DEFAULT_PEOPLE,
    templates: base.templates || DEFAULT_TEMPLATES,
    intakes: base.intakes || [],
    tasks: base.tasks || [],
    ratings: base.ratings || {},
    meetings: base.meetings || [],
    siteVisits: base.siteVisits || [],
    scopeSheet: base.scopeSheet || PROJECT_SCOPE_SHEET_ROWS,
  };
}

function useStudioState() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveErr, setSaveErr] = useState(false);
  const [backendErr, setBackendErr] = useState("");

  useEffect(() => {
    (async () => {
      let localState;
      try {
        const res = await window.storage.get(STORE_KEY, false);
        localState = res?.value ? normalizeStudioState(JSON.parse(res.value)) : normalizeStudioState({
          projects: SEED_PROJECTS, people: DEFAULT_PEOPLE, templates: DEFAULT_TEMPLATES, intakes: [], tasks: [], ratings: {}, meetings: [], siteVisits: [], scopeSheet: PROJECT_SCOPE_SHEET_ROWS
        });
      } catch {
        localState = normalizeStudioState({
          projects: SEED_PROJECTS, people: DEFAULT_PEOPLE, templates: DEFAULT_TEMPLATES, intakes: [], tasks: [], ratings: {}, meetings: [], siteVisits: [], scopeSheet: PROJECT_SCOPE_SHEET_ROWS
        });
      }

      try {
        const remote = await projectApi.listAll();
        if (Array.isArray(remote) && remote.length > 0) {
          localState = { ...localState, projects: remote.map(r => backendProjectToFrontend(r)) };
          try { await window.storage.set(STORE_KEY, JSON.stringify(localState), false); } catch {}
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
    try {
      const res = await window.storage.set(STORE_KEY, JSON.stringify(next), false);
      setSaveErr(!res);
    } catch { setSaveErr(true); }
    return next;
  }, []);

  return { state, loading, saveErr, backendErr, persist };
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
  const [projectId, setProjectId] = useState(state.projects[0]?.id || "");
  const [fileName, setFileName] = useState("");
  const [note, setNote] = useState("");
  const [justAdded, setJustAdded] = useState(false);

  const submit = async () => {
    if (!projectId || !fileName) return;
    const intake = { id: uid(), projectId, fileName, note, date: todayISO(), classified: false };
    await persist({ ...state, intakes: [intake, ...state.intakes] });
    setFileName(""); setNote("");
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2200);
  };

  const pending = state.intakes.filter((i) => !i.classified);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
      <div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, margin: "4px 0 18px", color: T.ink }}>Received — Upload</h2>
        <Field label="Project">
          <select style={inputStyle} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {state.projects.map((p) => <option key={p.id} value={p.id}>{p.no} — {p.name}</option>)}
          </select>
        </Field>
        <Field label="Drawing file">
          <div style={{
            border: `1.5px dashed ${T.line}`, borderRadius: 8, padding: "22px 16px",
            textAlign: "center", background: T.paperDim, cursor: "pointer",
          }} onClick={() => setFileName(fileName ? "" : `drawing_${uid()}.pdf`)}>
            <FileUp size={22} color={T.blue} style={{ marginBottom: 6 }} />
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.inkDim }}>
              {fileName ? <span style={{ color: T.ink, fontFamily: FONT_MONO }}>{fileName}</span> : "Click to simulate selecting a drawing file"}
            </div>
          </div>
        </Field>
        <Field label="Note (optional)">
          <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Received via email from Nextwall Architects" />
        </Field>
        <Btn onClick={submit} disabled={!fileName}>
          <Upload size={14} /> Log received drawing
        </Btn>
        {justAdded && <div style={{ marginTop: 12, fontFamily: FONT_MONO, fontSize: 12, color: T.green }}>Logged — now classify it to open tasks →</div>}
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
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: T.inkDim, marginTop: 2 }}>{proj?.name} · {fmtDate(i.date)}</div>
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

  const toggleZone = (z) => setZones((zs) => zs.includes(z) ? zs.filter((x) => x !== z) : [...zs, z]);

  const intake = state.intakes.find((i) => i.id === selectedId);
  const project = intake && state.projects.find((p) => p.id === intake.projectId);
  const letters = project ? sortedZoneLetters(project) : [];

  const submit = async () => {
    if (!selectedId || zones.length === 0 || !drawingType) return;
    const template = state.templates.find((t) => t.drawingType === drawingType);

    const newTasks = (template?.tasks || []).map((t) => ({
      id: uid(),
      projectId: project.id,
      projectName: project.name,
      zones: [...zones],
      drawingType,
      title: t.title,
      assignee: t.assignee,
      status: STATUS.TODO,
      date: todayISO(),
      hours: 0,
      sourceFile: intake.fileName,
    }));

    const nextIntakes = state.intakes.map((i) => i.id === selectedId ? { ...i, classified: true, zones, drawingType } : i);
    await persist({ ...state, intakes: nextIntakes, tasks: [...newTasks, ...state.tasks] });
    setZones([]); setDone(true);
    setTimeout(() => setDone(false), 2400);
  };

  const activeTemplate = state.templates.find((t) => t.drawingType === drawingType);

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
                <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: T.inkDim }}>{p?.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, margin: "4px 0 4px", color: T.ink }}>Classify drawing</h2>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.inkDim, marginBottom: 20 }}>{project?.name} · {intake?.fileName}</div>

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

        <Field label="Drawing type — determines which tasks open">
          <select style={inputStyle} value={drawingType} onChange={(e) => setDrawingType(e.target.value)}>
            {state.templates.map((t) => <option key={t.drawingType} value={t.drawingType}>{t.drawingType}</option>)}
          </select>
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
  const tasks = state.tasks.filter((t) => person === "All" || t.assignee === person);

  const updateTask = async (id, patch) => {
    const next = state.tasks.map((t) => t.id === id ? { ...t, ...patch } : t);
    await persist({ ...state, tasks: next });
  };

  // "A · GF · Master Bedroom" style label for a task's zones, looked
  // up from the project's own zone map so floor + area always travel
  // with the zone letter, same as the sheet's own convention.
  const zoneLabel = (task) => {
    const project = state.projects.find((p) => p.id === task.projectId);
    return task.zones.map((z) => {
      const zd = project?.zones?.[z];
      return zd ? `${z} · ${zd.floor}${zd.room ? " · " + zd.room : ""}` : z;
    }).join("  •  ");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, margin: 0, color: T.ink }}>Timesheet</h2>
        <div>
          <Chip active={person === "All"} onClick={() => setPerson("All")}>All</Chip>
          {state.people.map((p) => <Chip key={p} active={person === p} onClick={() => setPerson(p)}>{p}</Chip>)}
        </div>
      </div>

      {tasks.length === 0 && <div style={{ color: T.inkDim, fontFamily: FONT_BODY, fontSize: 13, padding: "20px 0" }}>No tasks yet — classify a received drawing to auto-generate tasks here.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tasks.map((t) => (
          <div key={t.id} style={{ background: "#fff", border: `1px solid ${T.line}`, borderRadius: 8, padding: "12px 16px", display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 100px 130px", gap: 12, alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: T.ink }}>{t.title}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.inkDim, marginTop: 2 }}>{t.projectName} · {zoneLabel(t)} · {t.drawingType}</div>
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: T.blue }}>{t.assignee}</div>
            <select value={t.status} onChange={(e) => updateTask(t.id, { status: e.target.value })}
              style={{ ...inputStyle, padding: "6px 8px", fontSize: 12, fontFamily: FONT_MONO, width: "auto" }}>
              {Object.values(STATUS).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="number" min={0} step={0.5} value={t.hours}
              onChange={(e) => updateTask(t.id, { hours: parseFloat(e.target.value) || 0 })}
              style={{ ...inputStyle, padding: "6px 8px", fontSize: 12, fontFamily: FONT_MONO }} />
            <StatusPill status={t.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   VIEW: DASHBOARD — the Floor | Zone matrix from the sheet:
   projects across the top, zone letters down the side, each cell
   showing that zone's floor + room, colored by live task status.
--------------------------------------------------------------- */
function DashboardView({ state }) {
  const rows = allZoneLetters(state.projects);

  const zoneStatus = (projectId, zoneLetter) => {
    const relevant = state.tasks.filter((t) => t.projectId === projectId && t.zones.includes(zoneLetter));
    if (relevant.length === 0) return null;
    if (relevant.every((t) => t.status === STATUS.DONE)) return STATUS.DONE;
    if (relevant.some((t) => t.status === STATUS.PROGRESS)) return STATUS.PROGRESS;
    return STATUS.TODO;
  };
  const cellColor = (s) => s === STATUS.DONE ? T.greenBg : s === STATUS.PROGRESS ? "#DDE7F5" : s === STATUS.TODO ? T.amberBg : "transparent";
  const cellFg = (s) => s === STATUS.DONE ? T.green : s === STATUS.PROGRESS ? T.blue : s === STATUS.TODO ? T.amber : T.inkDim;

  return (
    <div>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, margin: "4px 0 4px", color: T.ink }}>Floor / Zone — Scope of Work</h2>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.inkDim, marginBottom: 18 }}>Same layout as the Floor | Zone sheet — projects across the top, zone letters down the side. Each filled cell shows that zone's floor and room, colored by live task status.</div>
      <div style={{ overflow: "auto", border: `1px solid ${T.line}`, borderRadius: 8, background: "#fff", maxHeight: 560 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 760 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: "left", position: "sticky", left: 0, top: 0, background: T.navy, zIndex: 3, minWidth: 60 }}>Zone</th>
              {state.projects.map((p) => (
                <th key={p.id} style={{ ...thStyle, minWidth: 100, position: "sticky", top: 0, zIndex: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <span style={{ fontFamily: FONT_MONO, opacity: 0.7 }}>{p.no}</span>
                    <Dot c={statusColor(p.status || "Ongoing").fg} />
                  </div>
                  <div style={{ fontSize: 10.5, marginTop: 2, whiteSpace: "normal", lineHeight: 1.25 }}>{p.name}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((z) => (
              <tr key={z}>
                <td style={{ ...tdStyle, textAlign: "left", fontFamily: FONT_MONO, fontSize: 12, color: T.ink, position: "sticky", left: 0, background: T.paperDim, fontWeight: 700 }}>
                  {z}
                </td>
                {state.projects.map((p) => {
                  const zd = p.zones && p.zones[z];
                  const s = zoneStatus(p.id, z);
                  if (!zd) {
                    return <td key={p.id} style={{ ...tdStyle, color: T.line }}>·</td>;
                  }
                  return (
                    <td key={p.id} style={{ ...tdStyle, background: cellColor(s), color: cellFg(s) || T.ink }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 700 }}>{z} | {zd.floor}</div>
                      {zd.room && <div style={{ fontFamily: FONT_BODY, fontSize: 10, opacity: 0.85, whiteSpace: "normal", lineHeight: 1.2 }}>{zd.room}</div>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: 18, marginTop: 14, fontFamily: FONT_MONO, fontSize: 11, color: T.inkDim, flexWrap: "wrap" }}>
        <span><Dot c={T.amber} /> To do</span>
        <span><Dot c={T.blue} /> In progress</span>
        <span><Dot c={T.green} /> Done</span>
        <span><Dot c={T.line} /> Zone not part of this project</span>
      </div>
    </div>
  );
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
function ContactFields({ contacts, onChange }) {
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
            {roles.map((role) => (
              <div key={role} style={{ display: "grid", gridTemplateColumns: "170px 1fr 1fr 1fr", gap: 8, alignItems: "center" }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: T.inkDim }}>{role}</div>
                <input style={{ ...inputStyle, padding: "7px 10px", fontSize: 12.5 }} placeholder="Name" value={contacts[role]?.name || ""} onChange={(e) => onChange(role, "name", e.target.value)} />
                <input style={{ ...inputStyle, padding: "7px 10px", fontSize: 12.5 }} placeholder="Email" value={contacts[role]?.email || ""} onChange={(e) => onChange(role, "email", e.target.value)} />
                <input style={{ ...inputStyle, padding: "7px 10px", fontSize: 12.5 }} placeholder="Mobile" value={contacts[role]?.mobile || ""} onChange={(e) => onChange(role, "mobile", e.target.value)} />
              </div>
            ))}
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
      if (c && (c.name || "").trim()) cleanContacts[role] = { name: c.name.trim(), email: (c.email || "").trim(), mobile: (c.mobile || "").trim() };
    });
    const project = {
      id: uid(), no: draft.no.trim() || "—", name: draft.name.trim(), address: draft.address.trim(), type: draft.type,
      startDate: draft.startDate, endDate: draft.endDate, status: "Ongoing", contacts: cleanContacts, zones: {},
      projectStage: "Onboarding", projectStatus: "Ongoing", blocker: "", delayReason: "", plannedCompletionDate: draft.endDate || "",
      scope: { client: "", brief: "", targetDate: draft.endDate || "", rows: [], exclusions: "", notes: "" },
      lineOfWork: []
    };
    let created = project;
    try {
      const row = await projectApi.create(frontendProjectToBackend(project, false));
      created = backendProjectToFrontend(row, project);
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
    try { await projectApi.update(frontendProjectToBackend(nextProject, true)); }
    catch (err) { alert(`Google Sheets update failed: ${err?.message || err}`); return; }
    await persist({ ...state, projects: state.projects.map(p => p.id === projectId ? nextProject : p) });
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
            <ContactFields contacts={draft.contacts} onChange={(role, field, value) => setDraft(d => ({ ...d, contacts: { ...d.contacts, [role]: { ...(d.contacts[role] || {}), [field]: value } } }))} />
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
    setRow(found ? {...found} : {serial:"",project:project.name,client:"",architect:"",basement:false,silt_floor:false,gf:false,"1f":false,"2f":false,"3f":false,terrace:false,facade:false,wall_elevation:false,landscape:false,bath_elevation:false,wardrobe:false,kitchen:false,onboarding:false});
  }, [project?.id, state.scopeSheet]);
  if (!project || !row) return null;
  const boolFields = [["basement","Basement"],["silt_floor","Silt Floor"],["gf","GF"],["1f","1F"],["2f","2F"],["3f","3F"],["terrace","Terrace"],["facade","Facade"],["wall_elevation","Wall Elevation"],["landscape","Landscape"],["bath_elevation","Bath Elevation"],["wardrobe","Wardrobe"],["kitchen","Kitchen"],["onboarding","Onboarding"]];
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
  const project = state.projects.find(p => p.id === selectedId) || state.projects[0];
  const [editing, setEditing] = useState(false);
  const [directoryMode, setDirectoryMode] = useState(false);
  const [roleFilter, setRoleFilter] = useState("All");
  const [draft, setDraft] = useState({});
  if (!project) return null;
  const start = () => { setDraft(JSON.parse(JSON.stringify(project.contacts || {}))); setEditing(true); };
  const save = async () => { const clean={}; Object.entries(draft).forEach(([role,c])=>{if(c&&(c.name||"").trim()) clean[role]={name:c.name.trim(),email:(c.email||"").trim(),mobile:(c.mobile||"").trim()};}); await persist({...state,projects:state.projects.map(p=>p.id===project.id?{...p,contacts:clean}:p)}); setEditing(false); };
  const directory = buildDirectory(state.projects, state.ratings || {});
  const filtered = roleFilter === "All" ? directory : directory.filter(d=>d.roles.includes(roleFilter));
  const roles = Array.from(new Set(directory.flatMap(d=>d.roles))).sort();
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><div><h2 style={{fontFamily:FONT_DISPLAY,fontSize:20,margin:0,color:T.ink}}>Team & Ratings</h2><div style={{fontFamily:FONT_BODY,fontSize:13,color:T.inkDim,marginTop:4}}>Project contacts are shown here by default. Turn on Directory to see the consolidated directory view.</div></div><div style={{display:"flex",gap:8}}>{!editing && <Btn variant="ghost" onClick={start}>Edit / add contacts</Btn>}<Btn variant={directoryMode?"solid":"ghost"} onClick={()=>setDirectoryMode(v=>!v)}>{directoryMode?"Directory On":"Directory"}</Btn></div></div>
    {directoryMode ? <div>
      <div style={{display:"flex",gap:0,borderBottom:`1px solid ${T.ink}`,marginBottom:12,flexWrap:"wrap"}}>{["All",...roles].map(f=><button key={f} onClick={()=>setRoleFilter(f)} style={{border:"none",borderRight:`1px solid ${T.line}`,borderRadius:0,padding:"8px 12px",background:roleFilter===f?T.navy:T.paperDim,color:roleFilter===f?"#fff":T.ink,cursor:"pointer",fontFamily:FONT_MONO,fontSize:10}}>{f}</button>)}</div>
      <table style={{borderCollapse:"collapse",width:"100%",border:`1px solid ${T.line}`}}><thead><tr>{["Name","Company","Role","Projects","Rating"].map(h=><th key={h} style={{...thStyle,background:T.paperDim,color:T.ink,textAlign:"left",borderRadius:0}}>{h}</th>)}</tr></thead><tbody>{filtered.map((d,i)=><tr key={i}><td style={tdStyle}>{d.name}</td><td style={tdStyle}>{d.company||"—"}</td><td style={tdStyle}>{d.roles.join(", ")}</td><td style={tdStyle}>{d.projects.join(", ")}</td><td style={tdStyle}>{d.rating||"—"}</td></tr>)}</tbody></table>
    </div> : editing ? <><ContactFields contacts={draft} onChange={(role,field,value)=>setDraft(d=>({...d,[role]:{...(d[role]||{}),[field]:value}}))}/><div style={{display:"flex",gap:8}}><Btn onClick={save}><ClipboardCheck size={14}/> Save contacts</Btn><Btn variant="ghost" onClick={()=>setEditing(false)}>Cancel</Btn></div></> : <div style={{display:"flex",flexDirection:"column",gap:16}}>{ROLE_CATEGORIES.map(({category,roles})=>{const entries=roles.filter(r=>project.contacts?.[r]);if(!entries.length)return null;return <div key={category}><div style={{fontFamily:FONT_MONO,fontSize:10,letterSpacing:".08em",textTransform:"uppercase",color:categoryColor(category),marginBottom:8}}>{category}</div><div style={{borderTop:`2px solid ${T.ink}`,borderBottom:`1px solid ${T.line}`}}>{entries.map((role,idx)=>{const c=project.contacts[role];return <div key={role} style={{display:"grid",gridTemplateColumns:"170px 1fr 1fr 1fr",padding:"10px 0",borderTop:idx===0?"none":`1px solid ${T.line}`}}><div style={{fontFamily:FONT_MONO,fontSize:11.5,color:T.inkDim}}>{role}</div><div style={{fontFamily:FONT_BODY,fontSize:13}}>{c.name}</div><div style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim}}>{c.email||"—"}</div><div style={{fontFamily:FONT_MONO,fontSize:12,color:T.blue}}>{c.mobile||"—"}</div></div>})}</div></div>})}{Object.keys(project.contacts||{}).length===0&&<div style={{color:T.inkDim}}>No contacts on file.</div>}</div>}
  </div>;
}


const RESIDENCE_LINE_OF_WORK_TEMPLATE = [{"sourceRow": 7, "drawings": "Concept", "tasks": "Concept | 2D ", "hours": 24, "responsible": "", "milestone": "", "floor": "", "visits": "Visit", "visitBy": ""}, {"sourceRow": 8, "drawings": null, "tasks": "Preliminary Budgeting", "hours": null, "responsible": "", "milestone": "", "floor": "", "visits": "", "visitBy": ""}, {"sourceRow": 9, "drawings": null, "tasks": "Present & Discuss with CL | Architect", "hours": 24, "responsible": "", "milestone": "", "floor": "", "visits": "Visit", "visitBy": ""}, {"sourceRow": 10, "drawings": null, "tasks": "3D Renders", "hours": null, "responsible": "", "milestone": "", "floor": "", "visits": "", "visitBy": ""}, {"sourceRow": 11, "drawings": "False Ceiling Corrections", "tasks": "Typical Section Detail | Draw", "hours": 8, "responsible": "", "milestone": "False Ceiling", "floor": "UGF", "visits": "Briefing & Review", "visitBy": ""}, {"sourceRow": 12, "drawings": null, "tasks": null, "hours": 8, "responsible": "", "milestone": "False Ceiling", "floor": "1F", "visits": "Briefing & Review", "visitBy": ""}, {"sourceRow": 13, "drawings": null, "tasks": "Arranging samples for CL Review", "hours": 8, "responsible": "", "milestone": "False Ceiling", "floor": "2F", "visits": "Review", "visitBy": ""}, {"sourceRow": 14, "drawings": null, "tasks": "Issue & Discuss | Revision [if req.] | Approval Final [Milestone]", "hours": 8, "responsible": "", "milestone": "False Ceiling", "floor": "Terrace", "visits": "Review", "visitBy": ""}, {"sourceRow": 15, "drawings": null, "tasks": null, "hours": 8, "responsible": "", "milestone": "False Ceiling", "floor": "Stilt", "visits": "Review", "visitBy": ""}, {"sourceRow": 16, "drawings": "Wiring Drawings", "tasks": "RCP/FLR/CIR | Draw", "hours": 16, "responsible": "", "milestone": "Wiring", "floor": "UGF", "visits": "Briefing & Review", "visitBy": ""}, {"sourceRow": 17, "drawings": null, "tasks": null, "hours": 16, "responsible": "", "milestone": "Wiring", "floor": "1F", "visits": "Briefing & Review", "visitBy": ""}, {"sourceRow": 18, "drawings": null, "tasks": "Arranging samples for CL Review", "hours": 16, "responsible": "", "milestone": "Wiring", "floor": "2F", "visits": "Review", "visitBy": ""}, {"sourceRow": 19, "drawings": null, "tasks": "Issue & Discuss | Revision [if req.] | Approval Final [Milestone]", "hours": 16, "responsible": "", "milestone": "Wiring", "floor": "Terrace", "visits": "Review", "visitBy": ""}, {"sourceRow": 20, "drawings": null, "tasks": null, "hours": 16, "responsible": "", "milestone": "Wiring", "floor": "Stilt", "visits": "Review", "visitBy": ""}, {"sourceRow": 21, "drawings": null, "tasks": null, "hours": null, "responsible": "", "milestone": "Flooring", "floor": "1F", "visits": "Briefing & Review", "visitBy": ""}, {"sourceRow": 22, "drawings": null, "tasks": null, "hours": null, "responsible": "", "milestone": "Flooring", "floor": "2F", "visits": "Briefing & Review", "visitBy": ""}, {"sourceRow": 23, "drawings": null, "tasks": null, "hours": null, "responsible": "", "milestone": "Flooring", "floor": "3F", "visits": "Briefing & Review", "visitBy": ""}, {"sourceRow": 24, "drawings": null, "tasks": null, "hours": null, "responsible": "", "milestone": "Flooring", "floor": "4F", "visits": "Briefing & Review", "visitBy": ""}, {"sourceRow": 25, "drawings": null, "tasks": null, "hours": null, "responsible": "", "milestone": "Flooring", "floor": "Terrace", "visits": "Briefing & Review", "visitBy": ""}, {"sourceRow": 26, "drawings": null, "tasks": null, "hours": null, "responsible": "", "milestone": "Flooring", "floor": "Stilt", "visits": "Briefing & Review", "visitBy": ""}, {"sourceRow": 27, "drawings": "Bathroom Stone", "tasks": "Typical Section Detail | Draw", "hours": 8, "responsible": "", "milestone": "Bathroom Stone", "floor": "UGF", "visits": "Briefing & Review", "visitBy": ""}, {"sourceRow": 28, "drawings": null, "tasks": null, "hours": 8, "responsible": "", "milestone": "Bathroom Stone", "floor": "1F", "visits": "Briefing & Review", "visitBy": ""}, {"sourceRow": 29, "drawings": null, "tasks": "Arranging samples for CL Review", "hours": 8, "responsible": "", "milestone": "Bathroom Stone", "floor": "2F", "visits": "Review", "visitBy": ""}, {"sourceRow": 30, "drawings": null, "tasks": "Issue & Discuss | Revision [if req.] | Approval Final [Milestone]", "hours": 8, "responsible": "", "milestone": "Bathroom Stone", "floor": "Terrace", "visits": "", "visitBy": ""}, {"sourceRow": 31, "drawings": null, "tasks": null, "hours": 8, "responsible": "", "milestone": "Bathroom Stone", "floor": "Stilt", "visits": "", "visitBy": ""}, {"sourceRow": 32, "drawings": "Facade", "tasks": "Facade 3D | Typical Section Detail | Draw\nCL Meeting | Revision | Approval Final [Milestone]", "hours": 16, "responsible": "", "milestone": "Facade Elevation", "floor": "Facade", "visits": "Briefing & Review", "visitBy": ""}, {"sourceRow": 33, "drawings": null, "tasks": null, "hours": null, "responsible": "", "milestone": "Ceiling Pack | Moulding Sampling & Review", "floor": "UGF", "visits": "Briefing & Review", "visitBy": ""}, {"sourceRow": 34, "drawings": null, "tasks": null, "hours": null, "responsible": "", "milestone": "Ceiling Pack | Moulding Sampling & Review", "floor": "1F", "visits": "Review", "visitBy": ""}, {"sourceRow": 35, "drawings": null, "tasks": null, "hours": null, "responsible": "", "milestone": "Ceiling Pack | Moulding Sampling & Review", "floor": "2F", "visits": "Review", "visitBy": ""}, {"sourceRow": 36, "drawings": "Furniture", "tasks": "Typical Section Detail | Draw", "hours": 8, "responsible": "", "milestone": "Furniture", "floor": "UGF", "visits": "Briefing & Review", "visitBy": ""}, {"sourceRow": 37, "drawings": null, "tasks": "Arranging samples for CL Review", "hours": 8, "responsible": "", "milestone": "Furniture", "floor": "1F", "visits": "Briefing & Review", "visitBy": ""}, {"sourceRow": 38, "drawings": null, "tasks": "Issue & Discuss | Revision [if req.] | Approval Final [Milestone]", "hours": 8, "responsible": "", "milestone": "Furniture", "floor": "2F", "visits": "Review", "visitBy": ""}, {"sourceRow": 39, "drawings": null, "tasks": null, "hours": null, "responsible": "", "milestone": "", "floor": "", "visits": "", "visitBy": ""}, {"sourceRow": 40, "drawings": "Transition to Execution Phase", "tasks": "Documentation- Luminaire Schedule & BOQ", "hours": 40, "responsible": "", "milestone": "Finalise Architectural Lighting", "floor": "UGF", "visits": "Visit", "visitBy": ""}, {"sourceRow": 41, "drawings": null, "tasks": "External Review | Mockup | Discuss BOQ", "hours": null, "responsible": "", "milestone": "Finalise Architectural Lighting", "floor": "1F", "visits": "", "visitBy": ""}, {"sourceRow": 42, "drawings": null, "tasks": "Arranging samples for CL Review", "hours": null, "responsible": "", "milestone": "Finalise Architectural Lighting", "floor": "2F", "visits": "Visit", "visitBy": ""}, {"sourceRow": 43, "drawings": null, "tasks": "Present final BOQ with colour test | Close", "hours": null, "responsible": "", "milestone": "Finalise Architectural Lighting", "floor": "Terrace & Stilt", "visits": "", "visitBy": ""}, {"sourceRow": 44, "drawings": null, "tasks": "Light Marking Sheet | Arrange All Samples", "hours": 8, "responsible": "", "milestone": "Finalise Architectural Lighting", "floor": "", "visits": "", "visitBy": ""}, {"sourceRow": 45, "drawings": null, "tasks": "Site Execution Sheet", "hours": 8, "responsible": "", "milestone": "Finalise Architectural Lighting", "floor": "", "visits": "", "visitBy": ""}, {"sourceRow": 46, "drawings": "Execution Phase", "tasks": null, "hours": null, "responsible": "", "milestone": "Marking | Cutting", "floor": "UGF", "visits": "Weekly Visit Required", "visitBy": ""}, {"sourceRow": 47, "drawings": null, "tasks": null, "hours": null, "responsible": "", "milestone": "Marking | Cutting", "floor": "1F", "visits": "Weekly Visit Required", "visitBy": ""}, {"sourceRow": 48, "drawings": null, "tasks": null, "hours": null, "responsible": "", "milestone": "Marking | Cutting", "floor": "2F", "visits": "Weekly Visit Required", "visitBy": ""}, {"sourceRow": 49, "drawings": null, "tasks": null, "hours": null, "responsible": "", "milestone": "Marking | Cutting", "floor": "Terrace & Stilt", "visits": "Weekly Visit Required", "visitBy": ""}, {"sourceRow": 50, "drawings": "Execution Phase", "tasks": null, "hours": null, "responsible": "", "milestone": "Light Installation", "floor": "UGF", "visits": "Weekly Visit Required", "visitBy": ""}, {"sourceRow": 51, "drawings": null, "tasks": null, "hours": null, "responsible": "", "milestone": "Light Installation", "floor": "1F", "visits": "Weekly Visit Required", "visitBy": ""}, {"sourceRow": 52, "drawings": null, "tasks": null, "hours": null, "responsible": "", "milestone": "Light Installation", "floor": "2F", "visits": "Weekly Visit Required", "visitBy": ""}, {"sourceRow": 53, "drawings": null, "tasks": null, "hours": null, "responsible": "", "milestone": "Light Installation", "floor": "Terrace & Stilt", "visits": "Weekly Visit Required", "visitBy": ""}, {"sourceRow": 54, "drawings": "Execution Phase", "tasks": null, "hours": 4, "responsible": "", "milestone": "Snag List", "floor": "", "visits": "Weekly Visit Required", "visitBy": ""}, {"sourceRow": 55, "drawings": null, "tasks": null, "hours": 4, "responsible": "", "milestone": "Snag List", "floor": "", "visits": "Weekly Visit Required", "visitBy": ""}, {"sourceRow": 56, "drawings": null, "tasks": null, "hours": 4, "responsible": "", "milestone": "Snag List", "floor": "", "visits": "Weekly Visit Required", "visitBy": ""}, {"sourceRow": 57, "drawings": null, "tasks": null, "hours": 4, "responsible": "", "milestone": "Snag List", "floor": "", "visits": "Weekly Visit Required", "visitBy": ""}, {"sourceRow": 58, "drawings": null, "tasks": null, "hours": null, "responsible": "", "milestone": "Staging and Scene Setting", "floor": "", "visits": "Visit", "visitBy": ""}, {"sourceRow": 59, "drawings": null, "tasks": null, "hours": null, "responsible": "", "milestone": "Staging and Scene Setting", "floor": "", "visits": "Visit", "visitBy": ""}];

function residenceLineOfWorkDefaults(project, people) {
  const existing = project?.lineOfWorkResidence;
  if (existing && existing.length) return existing;
  return RESIDENCE_LINE_OF_WORK_TEMPLATE.map((r) => ({
    id: uid(), sourceRow: r.sourceRow, drawings: r.drawings || "", tasks: r.tasks || "",
    hours: r.hours ?? "", responsible: r.responsible || people[0] || "",
    milestone: r.milestone || "", floor: r.floor || "", visits: r.visits || "", visitBy: r.visitBy || ""
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
  const activeProjects=(state.projects||[]).filter(p=>p.status!=="Completed"&&p.projectControl?.projectStatus!=="Completed");
  const project=activeProjects.find(p=>p.id===selectedId)||activeProjects[0];
  const people=state.people||[];
  const [rows,setRows]=useState([]);
  const [saved,setSaved]=useState(false);

  useEffect(()=>{
    if(!project){setRows([]);return;}
    const split=splitDesignExecutionRows(project,people);
    setRows(split.design.map((r,i)=>({
      ...r,
      id:r.id||uid(),
      drawings:r.drawings||"",
      tasks:r.tasks||"",
      time:r.time||"",
      hours:r.hours??"",
      plannedStartDate:r.plannedStartDate||"",
      plannedCompletionDate:r.plannedCompletionDate||"",
      responsible:r.responsible||r.assignee||"",
      sequence:r.sequence||i+1
    })));
  },[project?.id]);

  if(!project)return <div style={{fontFamily:FONT_BODY,color:T.inkDim}}>No active project available. Completed projects are excluded from Line of Work.</div>;

  const update=(id,patch)=>setRows(rs=>rs.map(r=>r.id===id?{...r,...patch}:r));
  const addRow=()=>setRows(rs=>[...rs,{id:uid(),drawings:"",tasks:"",time:"",hours:"",plannedStartDate:"",plannedCompletionDate:"",responsible:"",milestone:"",sequence:rs.length+1}]);
  const removeRow=id=>setRows(rs=>rs.filter(r=>r.id!==id));

  const save=async()=>{
    const original=splitDesignExecutionRows(project,people);
    const combined=[...rows,...original.execution];
    const projects=state.projects.map(p=>p.id===project.id?{...p,lineOfWork:combined}:p);

    const generated=rows.map(r=>{
      const old=(state.tasks||[]).find(t=>t.lineTemplateRowId===r.id&&t.projectId===project.id);
      return {
        ...(old||{}),
        id:old?.id||uid(),
        lineTemplateRowId:r.id,
        projectId:project.id,
        projectName:project.name,
        zones:r.floor?[r.floor]:[],
        drawingType:r.drawings||"Residence Line of Work",
        title:r.tasks||r.drawings||"Project Work",
        assignee:r.responsible||"",
        status:old?.status||STATUS.TODO,
        date:old?.date||todayISO(),
        hours:old?.hours||0,
        estimatedHours:Number(r.hours)||0,
        time:r.time||"",
        plannedStartDate:r.plannedStartDate||"",
        plannedCompletionDate:r.plannedCompletionDate||"",
        sourceFile:"Residence Line of Work"
      };
    });
    const untouched=(state.tasks||[]).filter(t=>t.projectId!==project.id||!t.lineTemplateRowId||!rows.some(r=>r.id===t.lineTemplateRowId));
    await persist({...state,projects,tasks:[...generated,...untouched]});
    setSaved(true);setTimeout(()=>setSaved(false),1800);
  };

  const totalHours=rows.reduce((s,r)=>s+(Number(r.hours)||0),0);

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,marginBottom:18}}>
      <div>
        <div style={{fontFamily:FONT_MONO,fontSize:10,letterSpacing:".1em",textTransform:"uppercase",color:T.cyan,marginBottom:6}}>Residence Project · Design Sequence</div>
        <h2 style={{fontFamily:FONT_DISPLAY,fontSize:20,margin:0,color:T.ink}}>Line of Work</h2>
        <div style={{fontFamily:FONT_BODY,fontSize:13,color:T.inkDim,marginTop:5,maxWidth:850}}>
          Design/drawing portion only. The sheet stops before the first Milestone row. All milestone-and-after rows live only in Execution Dashboard.
        </div>
      </div>
      <div style={{display:"flex",gap:8}}><Btn variant="ghost" onClick={addRow}><Plus size={13}/> Add Row</Btn><Btn onClick={save}><ClipboardCheck size={14}/> Save Line of Work</Btn></div>
    </div>

    {saved&&<div style={{marginBottom:12,padding:"9px 12px",border:`1px solid ${T.green}`,background:T.greenBg,color:T.green,fontFamily:FONT_MONO,fontSize:11}}>Design Line of Work saved.</div>}

    <div style={{overflow:"auto",border:`1px solid ${T.ink}`,background:"#fff"}}>
      <table style={{borderCollapse:"collapse",width:"100%",minWidth:1250}}>
        <thead><tr>{["Line of Work / Drawings","Tasks","Time","Hours","Planned Start Date","Planned Completion Date","Responsible Person",""].map((h,i)=><th key={i} style={{...thStyle,background:"#D7D4CC",color:"#111",borderBottom:`2px solid ${T.ink}`,borderRight:`1px solid #B8B5AC`,padding:"10px 8px",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
        <tbody>{rows.map(r=><tr key={r.id}>
          <td style={{...tdStyle,minWidth:210}}><input value={r.drawings||""} onChange={e=>update(r.id,{drawings:e.target.value})} style={{...inputStyle,borderRadius:0,fontWeight:r.drawings?700:400}}/></td>
          <td style={{...tdStyle,minWidth:320}}><textarea value={r.tasks||""} onChange={e=>update(r.id,{tasks:e.target.value})} style={{...inputStyle,borderRadius:0,resize:"vertical",minHeight:38}}/></td>
          <td style={{...tdStyle,minWidth:90}}><input type="time" value={r.time||""} onChange={e=>update(r.id,{time:e.target.value})} style={{...inputStyle,borderRadius:0}}/></td>
          <td style={{...tdStyle,minWidth:90}}><input type="number" min="0" step="0.5" value={r.hours} onChange={e=>update(r.id,{hours:e.target.value})} style={{...inputStyle,borderRadius:0,textAlign:"right"}}/></td>
          <td style={{...tdStyle,minWidth:155}}><input type="date" value={r.plannedStartDate||""} onChange={e=>update(r.id,{plannedStartDate:e.target.value})} style={{...inputStyle,borderRadius:0}}/></td>
          <td style={{...tdStyle,minWidth:165}}><input type="date" value={r.plannedCompletionDate||""} onChange={e=>update(r.id,{plannedCompletionDate:e.target.value})} style={{...inputStyle,borderRadius:0}}/></td>
          <td style={{...tdStyle,minWidth:165}}><select value={r.responsible||""} onChange={e=>update(r.id,{responsible:e.target.value})} style={{...inputStyle,borderRadius:0}}><option value="">Unassigned</option>{people.map(p=><option key={p} value={p}>{p}</option>)}</select></td>
          <td style={{...tdStyle,width:46}}><button onClick={()=>removeRow(r.id)} style={{border:"none",background:"transparent",cursor:"pointer"}}><X size={14} color={T.inkDim}/></button></td>
        </tr>)}</tbody>
        <tfoot><tr><td colSpan={3} style={{...tdStyle,fontFamily:FONT_MONO,fontWeight:700}}>DESIGN TOTAL</td><td style={{...tdStyle,fontFamily:FONT_MONO,fontWeight:700,textAlign:"right"}}>{totalHours} h</td><td colSpan={4} style={tdStyle}/></tr></tfoot>
      </table>
    </div>
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
    const zi=next.findIndex(z=>
      (!item.floor || String(z.floor).toLowerCase()===String(item.floor).toLowerCase()) &&
      (!item.area || String(z.area).toLowerCase()===String(item.area).toLowerCase())
    );
    if(zi<0)return;
    next[zi].received[ri]=true;
    const opened=openDependentTasks(project,next[zi],ri,syncedIntakes);
    next[zi].statuses=opened.statuses;
    next[zi].taskDesignNos=opened.taskDesignNos;
    syncedIntakes=opened.nextIntakes;
  });
  return {zones:next,intakes:syncedIntakes};
}

function DrawingControlDashboard({state,persist}){
  const activeProjects=(state.projects||[]).filter(p=>p.status!=="Completed"&&p.projectControl?.projectStatus!=="Completed");
  const project=activeProjects[0];
  const [floor,setFloor]=useState("All");
  const [expanded,setExpanded]=useState({"GF":true,"1F":true});
  const initial=project?syncReceivedClassify(project,normaliseDrawingZones(project),state.intakes):{zones:[],intakes:state.intakes||[]};
  const [zones,setZones]=useState(initial.zones);
  const logs=project?.workLog?.length?project.workLog:DASHBOARD_SAMPLE_LOGS;

  useEffect(()=>{
    if(project){
      const synced=syncReceivedClassify(project,normaliseDrawingZones(project),state.intakes);
      setZones(synced.zones);
    }
  },[project?.id,state.intakes]);

  if(!project)return <div style={{fontFamily:FONT_BODY,color:T.inkDim}}>No active project available. Completed projects are excluded from Design Dashboard.</div>;

  const floors=["All",...Array.from(new Set(zones.map(z=>z.floor)))];
  const visibleFloors=floors.slice(1).filter(f=>floor==="All"||floor===f);
  const totalHours=logs.reduce((s,r)=>s+(Number(r.duration)||0),0);
  const personHours=Object.entries(logs.reduce((a,r)=>{const p=r.person||"Unassigned";a[p]=(a[p]||0)+(Number(r.duration)||0);return a;},{})).sort((a,b)=>b[1]-a[1]);

  const saveState=async(nextZones,nextIntakes)=>{
    const projects=state.projects.map(p=>p.id===project.id?{...p,drawingDashboardZones:nextZones}:p);
    await persist({...state,projects,intakes:nextIntakes??state.intakes});
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
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:16,marginBottom:18}}>
      <div>
        <h2 style={{fontFamily:FONT_DISPLAY,fontSize:22,margin:0,color:T.ink}}>Design Dashboard</h2>
        <div style={{fontFamily:FONT_BODY,fontSize:13,color:T.inkDim,marginTop:4}}>
          {project.name} · received drawings are triggers; Design Nos. belong to dependent tasks and flow into WIH.
        </div>
      </div>
      <Field label="Floor"><select value={floor} onChange={e=>setFloor(e.target.value)} style={{...inputStyle,borderRadius:0,minWidth:110}}>{floors.map(f=><option key={f}>{f}</option>)}</select></Field>
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
                <button onClick={()=>setExpanded(x=>({...x,[f]:!open}))} style={{width:"100%",border:0,borderBottom:`1px solid ${T.line}`,background:"#F4F2EC",padding:"9px 10px",display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontFamily:FONT_BODY,fontWeight:700,color:T.ink,textAlign:"left"}}>
                  {open?<ChevronDown size={14}/>:<ChevronRight size={14}/>} {f} · {rows.length} areas
                </button>
                {open&&rows.map(z=><div key={z._i} style={{display:"grid",gridTemplateColumns:"42px 52px 180px repeat(5,94px) repeat(11,minmax(108px,1fr))",borderBottom:`1px solid ${T.line}`,fontFamily:FONT_BODY,fontSize:9}}>
                  <div style={{padding:7,borderRight:`1px solid ${T.line}`,fontFamily:FONT_MONO}}>{z.cn}</div>
                  <div style={{padding:7,borderRight:`1px solid ${T.line}`,fontFamily:FONT_MONO}}>{z.floor}</div>
                  <div style={{padding:7,borderRight:`1px solid ${T.line}`,fontWeight:600}}>{z.area}</div>

                  {/* Receipt cells: checkbox ONLY. No Design No. here. */}
                  {z.received.map((v,ri)=><button key={ri} onClick={()=>toggleReceived(z._i,ri)} title={v?"Drawing received":"Waiting for Received & Classify"} style={{border:0,borderRight:`1px solid ${T.line}`,background:v?"#E8F2E9":"#FAF9F5",color:v?"#245C2B":"#999",padding:"6px 3px",cursor:"pointer",minHeight:50}}>
                    <div style={{fontSize:17,fontWeight:800}}>{v?"☑":"☐"}</div>
                    <div style={{fontSize:7,marginTop:3}}>{v?"Received":"Waiting"}</div>
                  </button>)}

                  {/* Task cells: Design No. belongs HERE */}
                  {z.statuses.map((s,si)=>{
                    const tone=taskStatusTone(s);
                    const dno=z.taskDesignNos?.[si]||"";
                    return <button key={si} onClick={()=>cycleTask(z._i,si)} style={{border:0,borderRight:`1px solid ${T.line}`,background:tone.bg,color:tone.fg,padding:"6px 4px",fontSize:8,cursor:(s==="Locked"||s==="Waiting for Drawing")?"default":"pointer",textAlign:"center",minHeight:50}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,fontWeight:700}}>
                        <span style={{width:6,height:6,borderRadius:"50%",background:tone.dot,flex:"0 0 auto"}}/>{s}
                      </div>
                      {dno&&<div style={{fontFamily:FONT_MONO,fontSize:7,marginTop:4,lineHeight:1.2}}>{dno}</div>}
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
          <div style={{fontFamily:FONT_MONO,fontSize:9,color:T.inkDim,letterSpacing:1}}>PROJECT WORK LOG</div>
          <div style={{fontFamily:FONT_DISPLAY,fontSize:22,marginTop:3}}>{totalHours.toFixed(1)} hrs</div>
          <div style={{fontFamily:FONT_BODY,fontSize:11,color:T.inkDim}}>logged on this project</div>
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
  </div>;
}

function DesignFlowView({state,persist}){return <DrawingControlDashboard state={state} persist={persist}/>;}
function ProjectInfoScopeMerged({state,persist,project}){
  if(!project)return <div style={{fontFamily:FONT_BODY,color:T.inkDim}}>Select a project.</div>;
  const scope=project.scope||{};
  const scopeFields=[
    ["Basement","basement"],["Silt Floor","siltFloor"],["GF","gf"],["1F","f1"],["2F","f2"],["3F","f3"],
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
  const fields=[["Basement","basement"],["Silt","siltFloor"],["GF","gf"],["1F","f1"],["2F","f2"],["3F","f3"],["Terrace","terrace"],["Facade","facade"],["Wall Elev.","wallElevation"],["Landscape","landscape"],["Bath Elev.","bathElevation"],["Wardrobe","wardrobe"],["Kitchen","kitchen"],["Onboarding","onboarding"]];
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
  const [tab, setTab] = useState("list");
  const [selectedId, setSelectedId] = useState(state.projects[0]?.id || null);
  const [showNewProject, setShowNewProject] = useState(false);
  const project = state.projects.find(p => p.id === selectedId) || state.projects[0];
  const [board, setBoard] = useState(null);

  useEffect(() => {
    setBoard(project?.designExecutionBoard || buildRoomCentricBoard(project));
  }, [project?.id]);

  if (!project && !showNewProject) {
    return <div>No projects yet. Use + New Project to create the first project.</div>;
  }

  const scopeFields = [
    ["Basement","basement"],["Silt Floor","silt_floor"],["GF","gf"],["1F","1f"],["2F","2f"],["3F","3f"],
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
      basement:false,silt_floor:false,gf:false,"1f":false,"2f":false,"3f":false,
      terrace:false,facade:false,wall_elevation:false,landscape:false,bath_elevation:false,
      wardrobe:false,kitchen:false,onboarding:false
    });
  };

  const toggleScope = async (p,key,e) => {
    if (e) e.stopPropagation();
    const row = scopeFor(p);
    const nextRow = {
      ...row,
      project:p.name||row.project||"",
      client:p.client||row.client||"",
      architect:p.architect||row.architect||"",
      [key]:!Boolean(row[key])
    };
    const allRows = state.scopeSheet || PROJECT_SCOPE_SHEET_ROWS;
    const exists = allRows.some(r => String(r.project||"").trim().toLowerCase() === String(p.name||"").trim().toLowerCase());
    const scopeSheet = exists
      ? allRows.map(r => String(r.project||"").trim().toLowerCase() === String(p.name||"").trim().toLowerCase() ? nextRow : r)
      : [...allRows,nextRow];
    const updatedProject = {...p,scope:nextRow};
    try { await projectApi.update(frontendProjectToBackend(updatedProject, true)); }
    catch (err) { alert(`Google Sheets scope update failed: ${err?.message || err}`); return; }
    const projects = state.projects.map(x => x.id===p.id ? updatedProject : x);
    await persist({...state,projects,scopeSheet});
  };

  const saveProject = async patch => {
    if (!project) return;
    const next={...project,...patch};
    try { await projectApi.update(frontendProjectToBackend(next, true)); }
    catch (err) { alert(`Google Sheets project update failed: ${err?.message || err}`); return; }
    await persist({...state,projects:state.projects.map(p=>p.id===project.id?next:p)});
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
        <button key={id} onClick={()=>setTab(id)} style={{
          padding:"11px 16px",border:"none",borderBottom:`3px solid ${tab===id?T.cyan:"transparent"}`,
          background:tab===id?T.navy:"transparent",color:tab===id?"#fff":T.inkDim,cursor:"pointer",
          fontFamily:FONT_BODY,fontSize:12,fontWeight:tab===id?700:500,whiteSpace:"nowrap"
        }}>{label}</button>
      )}
    </div>

    {tab==="list" && <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontFamily:FONT_MONO,fontSize:10,letterSpacing:".1em",textTransform:"uppercase",color:T.inkDim}}>Project Master</div>
        <div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim}}>{ongoingProjects.length} ongoing projects</div>
      </div>

      <div style={{overflowX:"auto",border:`1px solid ${T.line}`,background:"#fff"}}>
        <div style={{minWidth:1750}}>
          <div style={{
            display:"grid",
            gridTemplateColumns:"65px 260px 180px 180px repeat(14,78px) 105px",
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
              display:"grid",gridTemplateColumns:"65px 260px 180px 180px repeat(14,78px) 105px",
              borderBottom:`1px solid ${T.line}`,background:selected?"#F3F1EA":"#fff",cursor:"pointer",
              fontFamily:FONT_BODY,fontSize:10
            }}>
              <div style={{padding:8,borderRight:`1px solid ${T.line}`,fontFamily:FONT_MONO}}>{sc.serial||p.no||pi+1}</div>
              <div style={{padding:8,borderRight:`1px solid ${T.line}`,fontWeight:700}}>{p.name||sc.project||"—"}</div>
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
    {tab==="line"&&<ProjectLineOfWorkView state={state} persist={persist} selectedId={selectedId}/>}
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
  const [newPerson, setNewPerson] = useState("");
  const addPerson = async () => {
    if (!newPerson.trim()) return;
    await persist({ ...state, people: [...state.people, newPerson.trim()] });
    setNewPerson("");
  };
  const removePerson = async (name) => {
    await persist({ ...state, people: state.people.filter((p) => p !== name) });
  };
  const changeAssignee = async (drawingType, taskIdx, assignee) => {
    const templates = state.templates.map((t) => t.drawingType !== drawingType ? t : {
      ...t, tasks: t.tasks.map((tk, i) => i === taskIdx ? { ...tk, assignee } : tk),
    });
    await persist({ ...state, templates });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 32 }}>
      <div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, margin: "4px 0 18px", color: T.ink }}>Team</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {state.people.map((p) => (
            <div key={p} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", border: `1px solid ${T.line}`, borderRadius: 6, padding: "8px 12px" }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: 13 }}>{p}</span>
              <X size={14} color={T.inkDim} style={{ cursor: "pointer" }} onClick={() => removePerson(p)} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={inputStyle} placeholder="Add team member" value={newPerson} onChange={(e) => setNewPerson(e.target.value)} />
          <Btn onClick={addPerson}><Plus size={14} /></Btn>
        </div>
      </div>

      <div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, margin: "4px 0 18px", color: T.ink }}>Drawing type → task sequence</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {state.templates.map((t) => (
            <div key={t.drawingType} style={{ background: "#fff", border: `1px solid ${T.line}`, borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14, marginBottom: 8 }}>{t.drawingType}</div>
              {t.tasks.map((tk, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 13 }}>{tk.title}</span>
                  <select value={tk.assignee} onChange={(e) => changeAssignee(t.drawingType, idx, e.target.value)}
                    style={{ ...inputStyle, width: "auto", padding: "5px 8px", fontSize: 12, fontFamily: FONT_MONO }}>
                    {state.people.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
  const { state, loading, saveErr, backendErr, persist } = useStudioState();
  const [view, setView] = useState("project");

  if (loading || !state) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400, fontFamily: FONT_BODY, color: T.inkDim, gap: 8 }}>
        <Loader2 size={16} className="spin" /> Loading studio data…
        <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
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
        <div style={{ padding: "20px", marginTop: 20, fontFamily: FONT_MONO, fontSize: 10, color: T.cyan, opacity: 0.5 }}>
          enLIGHTen OS · project → scope → team → line of work → WIH
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
          
          {view === "dashboard" && <DashboardView state={state} />}
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
