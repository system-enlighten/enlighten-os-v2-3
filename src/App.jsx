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

const PROJECT_SCOPE_BOOLEAN_FIELDS = ['Basement', 'Stilt Floor', 'GF', '1F', '2F', '3F', 'Terrace', 'Facade', 'Landscape', 'Bath Elevation', 'Wardrobe', 'Kitchen', 'Art Curation', 'Onboarding'];


/*
PROJECT SCOPE — EXACT SOURCE STRUCTURE
Source workbook: Scope of work.xlsx
Columns:
S. No | Current Project | Client | Architect | Basement | Stilt Floor |
GF | 1F | 2F | 3F | Terrace | Facade | Landscape |
Bath Elevation | Wardrobe | Kitchen | Art Curation | Onboarding

Boolean scope fields must be displayed as real interactive checkboxes.
The stored data remains boolean true/false; the UI must never show the
raw strings "true" or "false" for these fields.
*/

import './LandingPage.css';
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
// Preserve the saved Owner role key so existing Sheet rows continue to match.
const contactRoleLabel = role => role === "Owner" ? "Client" : role;
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
  return (String(name ?? "").trim() + "|" + String(mobile ?? "").trim()).toLowerCase();
}

// Builds the vendor/contractor/designer directory by de-duplicating every
// named contact across every project's profile (matched on name + mobile),
// and rolling up which role(s) and which project(s) they've worked on —
// this is generated automatically, never entered by hand. Ratings are
// looked up separately since they're something you add after the fact.
function buildDirectory(projects, ratings) {
  const byKey = new Map();
  (Array.isArray(projects) ? projects : []).filter(Boolean).forEach((p) => {
    const contacts = p.contacts || {};
    Object.entries(contacts).forEach(([role, c]) => {
      if (!c || !(String(c.name ?? "").trim()||String(c.company ?? "").trim())) return;
      const key = contactKey(c.name||c.company, c.mobile);
      if (!byKey.has(key)) {
        byKey.set(key, { key, name: String(c.name ?? "").trim(), email: String(c.email ?? ""), mobile: String(c.mobile ?? ""), company: String(c.company ?? ""), roles: new Set(), projects: [], rating:0 });
      }
      const entry = byKey.get(key);
      entry.roles.add(role);
      entry.rating=Math.max(entry.rating,Math.min(5,Math.max(0,Number(c.rating)||0)));
      if (!entry.projects.find((pr) => pr.id === p.id)) entry.projects.push({ id: p.id, name: p.name, no: p.no, status: p.status });
    });
  });
  return Array.from(byKey.values())
    .map((e) => ({ ...e, roles: Array.from(e.roles), rating: e.rating || (ratings || {})[e.key]?.rating || 0, note: (ratings || {})[e.key]?.note || "" }))
    .sort((a, b) => b.projects.length - a.projects.length || a.name.localeCompare(b.name));
}

function directoryCorrections(projects,keys,values){
  const selected=new Set(keys);
  return projects.map(p=>{
    let changed=false;const contacts={...p.contacts};
    Object.entries(contacts).forEach(([role,c])=>{
      if(c&&selected.has(contactKey(c.name||c.company,c.mobile))){contacts[role]={...c,...values};changed=true;}
    });
    if(!changed)return p;
    return {...p,contacts,
      ...(contacts.Owner?{client:contacts.Owner.name||""}:{}),
      ...(contacts.Architect?{architect:contacts.Architect.name||""}:{})};
  });
}

function directoryRoleAssignments(projects,keys){
  const selected=new Set(keys);
  return Object.fromEntries(projects.map(p=>[p.id,Object.entries(p.contacts||{}).filter(([,c])=>c&&selected.has(contactKey(c.name||c.company,c.mobile))).map(([role])=>role)]));
}

function directoryMergeSelection(editor,entry,checked,projects){
  const keys=checked?[...new Set([...editor.keys,entry.key])]:editor.keys.filter(k=>k!==entry.key);
  const incoming=directoryRoleAssignments(projects,[entry.key]),remaining=directoryRoleAssignments(projects,keys);
  const assignments={...editor.assignments};
  for(const p of projects){
    assignments[p.id]=checked?[...new Set([...(assignments[p.id]||[]),...incoming[p.id]])]:(assignments[p.id]||[]).filter(r=>!incoming[p.id].includes(r)||remaining[p.id].includes(r));
  }
  return {...editor,keys,assignments};
}

// Each project has its own explicit role selection. Other people's roles stay intact.
function directoryProjectChanges(projects,keys,values,projectIds,addRole,assignments){
  const selected=new Set(keys),linked=new Set(projectIds||[]);
  return projects.map(p=>{
    const contacts={...p.contacts};let changed=false;
    const existing=Object.entries(contacts).filter(([,c])=>c&&selected.has(contactKey(c.name||c.company,c.mobile))).map(([r])=>r);
    const desired=assignments?(assignments[p.id]||[]):linked.has(p.id)?existing.length?existing:[addRole]:[];
    for(const role of existing){if(desired.includes(role))contacts[role]={...contacts[role],...values};else delete contacts[role];changed=true;}
    for(const role of desired){
      if(existing.includes(role))continue;
      if(!role)throw new Error("Choose a role for newly added projects.");
      const occupied=contacts[role];
      if(occupied&&(occupied.name||occupied.company))throw new Error(`${p.name||p.id}: ${contactRoleLabel(role)} is already assigned. Choose another role or edit that project's team first.`);
      contacts[role]={...values};changed=true;
    }
    if(!changed)return p;
    return {...p,contacts,
      ...(JSON.stringify(p.contacts?.Owner)!==JSON.stringify(contacts.Owner)?{client:contacts.Owner?.name||""}:{}),
      ...(JSON.stringify(p.contacts?.Architect)!==JSON.stringify(contacts.Architect)?{architect:contacts.Architect?.name||""}:{})};
  });
}

function DirectoryStars({value=0,onChange,disabled=false,name="contact"}){
  return <span role="group" aria-label={`Rating for ${name}`} style={{display:"inline-flex",whiteSpace:"nowrap"}}>{[1,2,3,4,5].map(n=><button key={n} type="button" aria-label={`Rate ${name} ${n} out of 5`} aria-pressed={Number(value)===n} disabled={disabled} onClick={()=>onChange(n)} style={{border:0,background:"transparent",padding:"4px 2px",fontSize:23,color:n<=Number(value)?"#B57812":"#878787",cursor:disabled?"wait":"pointer"}}>{n<=Number(value)?"★":"☆"}</button>)}</span>;
}

function ProjectDirectory({state,persist}){
  const [query,setQuery]=useState("");
  const [role,setRole]=useState("All");
  const [editor,setEditor]=useState(null);
  const [mergeQuery,setMergeQuery]=useState("");
  const [projectQuery,setProjectQuery]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const pendingRef=useRef(false),latestRef=useRef(state);latestRef.current=state;
  const directory=buildDirectory(state.projects,state.ratings||{});
  const roles=[...new Set(directory.flatMap(d=>d.roles))].sort();
  const visible=directory.filter(d=>(role==="All"||d.roles.includes(role))&&[d.name,d.company,d.mobile,d.email,...d.roles.map(contactRoleLabel)].join(" ").toLowerCase().includes(query.toLowerCase()));
  const start=d=>{setMessage("");setEditor({keys:[d.key],name:d.name,company:d.company,email:d.email,mobile:d.mobile,rating:d.rating,assignments:directoryRoleAssignments(state.projects,[d.key])});setMergeQuery("");setProjectQuery("");};
  const save=async(keys,values,projectIds,addRole,assignments)=>{
    if(pendingRef.current)return;
    if(Object.hasOwn(values,"name")&&!values.name.trim()&&!values.company.trim()){setMessage("Enter a name or company before saving.");return;}
    const before=latestRef.current;
    let projects;
    try{projects=assignments||projectIds?directoryProjectChanges(before.projects,keys,values,projectIds,addRole,assignments):directoryCorrections(before.projects,keys,values);}catch(err){setMessage(err.message);return;}
    const changed=projects.filter((p,i)=>p!==before.projects[i]);
    if(!changed.length){setEditor(null);return;}
    const next={...before,projects};latestRef.current=next;
    pendingRef.current=true;setBusy(true);setEditor(null);setMessage(`Changes applied · Saving ${changed.length} project(s)…`);
    const failed=[],warnings=[];
    try{await persist(next);}catch(err){latestRef.current=before;setMessage(err.message);pendingRef.current=false;setBusy(false);return;}
    for(const project of changed){
      try{await projectApi.saveContacts(project.id,contactsObjectToRows(project,project.contacts));}
      catch(err){failed.push({project,error:err});continue;}
      const original=before.projects.find(p=>p.id===project.id);
      const summaryContactChanged=original.client!==project.client||original.architect!==project.architect;
      if(summaryContactChanged){
        try{const latest=latestRef.current.projects.find(p=>p.id===project.id)||project;await projectApi.update(frontendProjectToBackend(latest,true));}
        catch(err){warnings.push(project.name||project.id);}
      }
    }
    if(failed.length){
      const latest=latestRef.current;
      const restored={...latest,projects:latest.projects.map(p=>{
        const failure=failed.find(f=>f.project.id===p.id);if(!failure)return p;
        const original=before.projects.find(x=>x.id===p.id),contacts={...p.contacts};
        for(const role of new Set([...Object.keys(failure.project.contacts||{}),...Object.keys(original.contacts||{})]))if(JSON.stringify(contacts[role])===JSON.stringify(failure.project.contacts?.[role])){if(original.contacts?.[role])contacts[role]=original.contacts[role];else delete contacts[role];}
        return {...p,contacts,...(p.client===failure.project.client?{client:original.client}:{}),...(p.architect===failure.project.architect?{architect:original.architect}:{})};
      })};
      latestRef.current=restored;await persist(restored);
    }
    setMessage(failed.length?`Could not save: ${failed.map(f=>f.project.name||f.project.id).join(", ")}. Their previous values were restored; edit these entries and retry.`:warnings.length?`Contacts and ratings saved. Project summary sync failed for ${warnings.join(", ")}; edit and save again to retry.`:"Directory updated in all linked projects. Ratings saved to Google Sheets.");
    pendingRef.current=false;setBusy(false);
  };
  const cell={...tdStyle,textAlign:"left",verticalAlign:"top",fontFamily:FONT_BODY,fontSize:13,lineHeight:1.5,padding:"14px 12px",borderRight:`1px solid ${T.line}`,overflowWrap:"anywhere"};
  return <section aria-label="Project contact directory" style={{fontFamily:FONT_BODY,color:T.ink}}>
    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
      <input aria-label="Search directory" placeholder="Search name, studio, email or phone" value={query} onChange={e=>setQuery(e.target.value)} style={{...inputStyle,maxWidth:380}}/>
      <select aria-label="Directory role" value={role} onChange={e=>setRole(e.target.value)} style={{...inputStyle,maxWidth:260}}>{["All",...roles].map(r=><option key={r} value={r}>{contactRoleLabel(r)}</option>)}</select>
    </div>
    {message&&<p role="status" style={{fontSize:12}}>{message}</p>}
    <div style={{overflowX:"auto"}}><table style={{borderCollapse:"collapse",width:"100%",minWidth:1140,tableLayout:"fixed",border:`1px solid ${T.line}`,fontFamily:FONT_BODY}}><colgroup>{[14,15,15,32,13,11].map((w,i)=><col key={i} style={{width:`${w}%`}}/>)}</colgroup><thead><tr>{["Name","Company / Studio","Role","Projects","Rating","Actions"].map(h=><th key={h} style={{...thStyle,background:"#D2CDC1",color:"#1C1C19",fontFamily:FONT_MONO,textAlign:"left",fontSize:10,padding:"12px",borderRight:`1px solid ${T.line}`,borderBottom:`2px solid ${T.ink}`}}>{h}</th>)}</tr></thead><tbody>{visible.map(d=><tr key={d.key}>
      <td style={cell}><strong>{d.name||"—"}</strong><div style={{fontSize:12,color:T.inkDim}}>{d.mobile}</div></td><td style={cell}>{d.company||"—"}</td><td style={cell}>{d.roles.map(r=><div key={r}>{contactRoleLabel(r)}</div>)}</td>
      <td style={{...cell,padding:0}}><div style={{maxHeight:220,overflowY:"auto"}}>{d.projects.map((p,i)=><div key={p.id} style={{padding:"9px 12px",borderTop:i?`1px solid ${T.line}`:"none",textAlign:"left"}}>{p.no&&<span style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim,marginRight:8}}>{p.no}</span>}{p.name||p.id}<div style={{fontSize:11,color:T.inkDim,marginTop:3}}>{Object.entries(state.projects.find(x=>x.id===p.id)?.contacts||{}).filter(([,c])=>c&&contactKey(c.name||c.company,c.mobile)===d.key).map(([r])=>contactRoleLabel(r)).join(" · ")}</div></div>)}</div></td>
      <td style={cell}><DirectoryStars name={d.name||d.company} value={d.rating} disabled={busy} onChange={rating=>save([d.key],{rating})}/></td>
      <td style={cell}><div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:12}}><button type="button" disabled={busy} onClick={()=>start(d)} style={{...smallBtn,fontFamily:FONT_BODY}}>Edit / merge</button></div></td>
    </tr>)}</tbody></table>{!visible.length&&<p>No matching contacts.</p>}</div>
    {editor&&<div role="dialog" aria-modal="true" aria-label="Edit directory contact" style={{position:"fixed",inset:0,zIndex:15000,background:"rgba(8,25,45,.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:T.paper,padding:22,width:760,maxWidth:"100%",maxHeight:"90vh",overflowY:"auto",fontFamily:FONT_BODY,fontSize:13,lineHeight:1.55,color:T.ink}}>
      <h3 style={{fontFamily:FONT_DISPLAY,fontSize:20,margin:"0 0 20px"}}>Edit directory contact</h3>
      {message&&<p role="status" style={{fontFamily:FONT_BODY,color:T.redline}}>{message}</p>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:12}}>{[["Name","name"],["Company / Studio","company"],["Email","email"],["Mobile","mobile"]].map(([label,key])=><label key={key} style={{display:"grid",gap:6,fontFamily:FONT_BODY,fontSize:12,fontWeight:600,color:T.inkDim}}>{label}<input aria-label={`Directory ${label}`} value={editor[key]} onChange={e=>setEditor(x=>({...x,[key]:e.target.value}))} style={{...inputStyle,fontFamily:FONT_BODY,fontSize:13,fontWeight:400}}/></label>)}</div>
      <DirectoryStars name="edited contact" value={editor.rating} onChange={rating=>setEditor(x=>({...x,rating}))}/>
      <p>Choose any duplicate entries below to give them the same details and rating in every linked project. Different people are combined only when you select them.</p>
      <input aria-label="Find duplicates" placeholder="Find names, studios or designations" value={mergeQuery} onChange={e=>setMergeQuery(e.target.value)} style={{...inputStyle,fontFamily:FONT_BODY,fontSize:13,fontWeight:400}}/>
      <div style={{maxHeight:240,overflowY:"auto",marginTop:12,border:`1px solid ${T.line}`}}>{directory.filter(d=>[d.name,d.company,d.mobile,...d.roles.map(contactRoleLabel)].join(" ").toLowerCase().includes(mergeQuery.toLowerCase())).map(d=><label key={d.key} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px",borderBottom:`1px solid ${T.line}`,fontFamily:FONT_BODY,fontSize:13,lineHeight:1.5,cursor:"pointer"}}><input type="checkbox" aria-label={`Merge ${d.name||d.company}`} style={{width:16,height:16,marginTop:3,flexShrink:0,accentColor:T.navy}} checked={editor.keys.includes(d.key)} onChange={e=>setEditor(x=>directoryMergeSelection(x,d,e.target.checked,state.projects))}/><span style={{minWidth:0}}><strong style={{fontWeight:600}}>{d.name||"Unnamed"}</strong><span style={{display:"block",fontSize:12,color:T.inkDim}}>{d.company||"No studio"} · {d.mobile||"No phone"} · {d.projects.length} project(s)</span><span style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:5}}>{d.roles.map(r=><span key={r} style={{background:T.paperDim,border:`1px solid ${T.line}`,padding:"2px 7px",fontFamily:FONT_BODY,fontSize:11,fontWeight:500,color:T.ink}}>{contactRoleLabel(r)}</span>)}</span></span></label>)}</div>
      <h4 style={{fontFamily:FONT_DISPLAY,marginBottom:8}}>Project roles</h4>
      <p style={{fontSize:13}}>Each checkbox is a separate assignment in that project. Uncheck Lighting Designer to remove only that role; Principal Lighting Designer stays selected. Use Add role to assign another designation.</p>
      <input aria-label="Search linked projects" placeholder="Search project name, number or role" value={projectQuery} onChange={e=>setProjectQuery(e.target.value)} style={{...inputStyle,fontFamily:FONT_BODY,fontSize:13,fontWeight:400}}/>
      <div style={{maxHeight:360,overflowY:"auto",marginTop:8,border:`1px solid ${T.line}`}}>{state.projects.filter(p=>`${p.no||""} ${p.name||""} ${[...new Set([...(editor.assignments[p.id]||[]),...directoryRoleAssignments([p],editor.keys)[p.id]])].map(contactRoleLabel).join(" ")}`.toLowerCase().includes(projectQuery.toLowerCase())).sort((a,b)=>Number(!!editor.assignments[b.id]?.length)-Number(!!editor.assignments[a.id]?.length)).map(p=>{
        const original=directoryRoleAssignments([p],editor.keys)[p.id],assigned=editor.assignments[p.id]||[];
        const shown=[...new Set([...original,...assigned])];
        return <div key={p.id} style={{padding:12,borderBottom:`1px solid ${T.line}`,fontFamily:FONT_BODY,fontSize:13}}>
          <strong>{p.no?`${p.no} · `:""}{p.name||p.id}</strong>
          <div style={{display:"grid",gap:8,margin:"10px 0"}}>{shown.length?shown.map(r=><label key={r} style={{display:"flex",alignItems:"center",gap:9}}><input type="checkbox" aria-label={`${contactRoleLabel(r)} in ${p.name||p.id}`} checked={assigned.includes(r)} onChange={e=>setEditor(x=>({...x,assignments:{...x.assignments,[p.id]:e.target.checked?[...new Set([...(x.assignments[p.id]||[]),r])]:(x.assignments[p.id]||[]).filter(v=>v!==r)}}))}/><span>{contactRoleLabel(r)}</span></label>):<span style={{fontSize:12,color:T.inkDim}}>No roles assigned</span>}</div>
          <select aria-label={`Add role in ${p.name||p.id}`} value="" style={{...inputStyle,fontFamily:FONT_BODY,fontSize:12,maxWidth:330}} onChange={e=>{const r=e.target.value;if(r)setEditor(x=>({...x,assignments:{...x.assignments,[p.id]:[...new Set([...(x.assignments[p.id]||[]),r])]}}));}}><option value="">Add role…</option>{[...new Set([...ROLES,...original])].filter(r=>!assigned.includes(r)).map(r=>{const c=p.contacts?.[r],occupied=c&&(c.name||c.company)&&!editor.keys.includes(contactKey(c.name||c.company,c.mobile));return <option key={r} value={r} disabled={!!occupied}>{contactRoleLabel(r)}{occupied?` — assigned to ${c.name||c.company}`:""}</option>;})}</select>
        </div>;
      })}</div>
      <p>{Object.values(editor.assignments).filter(rs=>rs.length).length} project(s) · {Object.values(editor.assignments).reduce((n,rs)=>n+rs.length,0)} role assignment(s) selected.</p>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button style={{...smallBtn,fontFamily:FONT_BODY,fontSize:13,padding:"9px 14px"}} onClick={()=>setEditor(null)}>Cancel</button><button disabled={busy||!editor.keys.length} style={{...smallBtn,fontFamily:FONT_BODY,fontSize:13,padding:"9px 14px",background:T.navy,color:"#fff"}} onClick={()=>{const {keys,assignments,...values}=editor;return save(keys,Object.fromEntries(Object.entries(values).map(([k,v])=>[k,typeof v==="string"?v.trim():v])),undefined,undefined,assignments);}}>Save Changes</button></div>
    </div></div>}
  </section>;
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

async function apiRequest(action, payload = {}, method = "POST", timeoutMs=0) {
  let response,raw;
  const controller=timeoutMs?new AbortController():null;
  const timeout=controller?setTimeout(()=>controller.abort(),timeoutMs):null;
  try{
  const generation=AUTH_SESSION_GENERATION;
  const authHeaders=AUTH_ID_TOKEN?{Authorization:`Bearer ${AUTH_ID_TOKEN}`}:{ };
  if (method === "GET") {
    const qs = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(payload).map(([k,v]) => [k, String(v)])) });
    response = await fetch(`${ENLIGHTEN_API_URL}?${qs.toString()}`,{credentials:"same-origin",headers:authHeaders,...(controller?{signal:controller.signal}:{})});
  } else {
    response = await fetch(ENLIGHTEN_API_URL, {
      method: "POST",
      credentials:"same-origin",
      ...(controller?{signal:controller.signal}:{}),
      headers: { "Content-Type": "text/plain;charset=utf-8", ...authHeaders },
      body: JSON.stringify({ action, payload })
    });
  }
  if(response.status===401&&generation===AUTH_SESSION_GENERATION){AUTH_ID_TOKEN="";window.dispatchEvent(new Event("enlighten-auth-expired"));}
  raw = await response.text();
  }catch(err){if(err.name==='AbortError')throw new Error(`The request could not be confirmed within ${Math.round(timeoutMs/1000)} seconds. Your details are retained; retry to check the result.`);if(err instanceof TypeError)throw new Error('The connection ended before the server confirmed the result. Your details are retained. Check your connection, then retry.');throw err;}
  finally{if(timeout)clearTimeout(timeout);}
  if(response.status===413)throw new Error("This request exceeds the upload size limit. Redeploy the latest frontend and backend to use drawing uploads in smaller parts.");
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
  saveMemberProjectRoles:payload=>apiRequest("saveMemberProjectRoles",payload,"POST",60000),
  getProjectWorkspace:()=>apiRequest("getProjectWorkspace",{},"GET"),
  saveProjectMeeting:payload=>apiRequest("saveProjectMeeting",payload),
  deleteProjectMeeting:payload=>apiRequest("deleteProjectMeeting",payload),
  getCurrentUser: () => apiRequest("getCurrentUser", {}, "GET"),
  listAll: () => apiRequest("listProjects", { activeOnly: false }, "GET"),
  create: payload => apiRequest("createProject", payload),
  update: payload => apiRequest("updateProject", payload),
  delete: projectId => apiRequest("deleteProject", { projectId }),
  complete: (projectId, completionOutcome) => apiRequest("completeProject", { projectId, completionOutcome }),
  listContacts: projectId => apiRequest("listProjectContacts", projectId ? { projectId } : {}, "GET"),
  saveContacts: (projectId, contacts) => apiRequest("saveProjectContacts", { projectId, contacts }),
  getWorkflowCapabilities: () => apiRequest("getWorkflowCapabilities",{},"GET"),
  listLineOfWork: projectId => apiRequest("listLineOfWork", projectId ? { projectId } : {}, "GET"),
  skipWorkflowSubtask: designTaskId => apiRequest("skipWorkflowSubtask",{designTaskId}),
  acknowledgeWorkflowDrawing: designTaskId => apiRequest("acknowledgeWorkflowDrawing",{designTaskId}),
  queueWorkflowTask: payload => apiRequest("queueWorkflowTask", payload),
  saveLineOfWork: (projectId, rows) => apiRequest("saveLineOfWork", { projectId, rows },"POST",45000),
  getProjectWorkflowTasks: projectId => apiRequest('getProjectWorkflowTasks',{projectId},'GET'),
  updateWorkflowSchedule: payload => apiRequest('updateWorkflowSchedule',payload),
  listProjectRoles: () => apiRequest('listProjectRoles',{},'GET'),
  saveProjectRole: payload => apiRequest('saveProjectRole',payload),
  deleteProjectRole: payload => apiRequest('deleteProjectRole',payload),
  listProjectPeople: () => apiRequest('listProjectPeople',{},'GET'),
  listSitePunchIns: projectId => apiRequest('listSitePunchIns',projectId?{projectId}:{},'GET'),
  saveSitePunchIn: payload => apiRequest('saveSitePunchIn',payload),
  deleteSitePunchIn: payload => apiRequest('deleteSitePunchIn',payload),
  listFloorZones: projectId => apiRequest("listFloorZones", projectId ? { projectId } : {}, "GET"),
  deleteFloorZones: (projectId,targets) => apiRequest("deleteFloorZones",{projectId,targets}),
  saveFloorZones: (projectId, rows) => apiRequest("saveFloorZones", { projectId, rows }),
  listDrawingRegister: projectId => apiRequest("listDrawingRegister", {projectId}, "GET"),
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
  return Object.entries(contacts || {}).filter(([,c]) => c && (String(c.name ?? "").trim()||String(c.company ?? "").trim())).map(([role,c]) => ({
    projectId: project.id, projectNo: project.no || "", projectName: project.name || "",
    category: contactCategoryForRole(role), role,
    name: String(c.name ?? "").trim(), email: String(c.email ?? "").trim(),
    mobile: String(c.mobile ?? "").trim(), company: String(c.company ?? "").trim(), rating: c.rating || ""
  }));
}

function contactRowsToObject(rows) {
  const out = {};
  (Array.isArray(rows) ? rows : []).forEach(r => {
    if (!r?.role || !(String(r.name ?? "").trim()||String(r.company ?? "").trim())) return;
    out[String(r.role)] = {...r, name:String(r.name ?? ""), email:String(r.email ?? ""),
      mobile:String(r.mobile ?? ""), company:String(r.company ?? ""), rating:r.rating || ""};
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
    terrace: isTrue(row.terrace), facade: isTrue(row.facade), wall_elevation: isTrue(row.wallElevation), art_curation: isTrue(row.artCuration),
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
    completionOutcome: row.completionOutcome || fallback.completionOutcome || "",
    completed: status === "Completed",
    completedDate: status === "Completed" ? (row.completedDate || fallback.completedDate || "") : "",
    completedAt: isTrue(row.completed) || status === "Completed" ? (row.updatedAt || row.completedDate || fallback.completedAt || "") : "",
    driveFolderId: row.driveFolderId || fallback.driveFolderId || "", scope,
    projectControl: { ...(fallback.projectControl || {}),
      currentStage: row.currentStage || fallback.projectControl?.currentStage || fallback.projectStage || "Onboarding",
      projectStatus: status,
      completedAt: status === "Completed" ? (row.updatedAt || row.completedDate || fallback.projectControl?.completedAt || "") : ""
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
    completionOutcome: p.completionOutcome || "",
    basement: Boolean(s.basement), stiltFloor: Boolean(s.stilt_floor), gf: Boolean(s.gf),
    "1f": Boolean(s["1f"]), "2f": Boolean(s["2f"]), "3f": Boolean(s["3f"]), terrace: Boolean(s.terrace),
    facade: Boolean(s.facade), wallElevation: Boolean(s.wall_elevation), artCuration: Boolean(s.art_curation), landscape: Boolean(s.landscape),
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
    pendingProjectCreates: base.pendingProjectCreates||[],
    pendingReceivedUploads: base.pendingReceivedUploads||[],
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

function workspaceIntakes(workspace){
  const files=workspace.files||[];
  return (workspace.drawings||[]).filter(d=>String(d.direction||'Received').toLowerCase()==='received').map(d=>{
    const file=files.find(f=>f.linkedEntityId===d.drawingId)||files.find(f=>f.driveFileId&&f.driveFileId===d.driveFileId)||{};
    let floors=[];try{floors=JSON.parse(d.floorTags||'[]');}catch(_){}
    return {id:d.drawingId,projectId:d.projectId,floor:d.floor||'',floors:floors.length?floors:String(d.floor||'').split(',').map(x=>x.trim()).filter(Boolean),zone:'',areas:d.area?[d.area]:[],drawingType:canonicalDrawingType(d.drawingType),fileName:file.fileName||'Drawing',driveUrl:d.driveUrl||file.driveUrl||'',note:d.notes||'',date:d.receivedSentDate||'',uploadedAt:d.createdAt||'',classified:d.classified===true||String(d.classified)==='true',source:'Received Upload'};
  });
}
function mergeMemberState(before,next,user){
  const viewer=user.appAccess.toLowerCase()==='viewer',assigned=id=>!!user.projectRoles?.[id];
  if(next.projects.length!==before.projects.length||next.projects.some(p=>!before.projects.some(x=>x.id===p.id)))throw Error('Only System Admin can add or remove projects.');
  for(const p of next.projects){const previous=before.projects.find(x=>x.id===p.id);if(JSON.stringify(p)===JSON.stringify(previous))continue;
    if(viewer||!assigned(p.id))throw Error('Project is view only.');
    if(user.projectRoles[p.id]!=='Admin'){
      const keys=new Set([...Object.keys(p),...Object.keys(previous)]);
      if([...keys].some(k=>!['floorZones','zones'].includes(k)&&JSON.stringify(p[k])!==JSON.stringify(previous[k])))throw Error('Project Admin controls scope and Line of Work.');
    }
  }
  const result={...before,projects:next.projects};
  for(const field of ['intakes','tasks','meetings','pendingReceivedUploads']){
    if(next[field]===undefined||JSON.stringify(next[field])===JSON.stringify(before[field]))continue;
    if(viewer)throw Error('This account is view only.');
    if(next[field].some(r=>!assigned(r.projectId||r.metadata?.projectId)))throw Error('Project access required.');
    result[field]=next[field];
  }
  return result;
}
function useStudioState() {
  const [state, setState] = useState(null);
  const stateRef=useRef(state);stateRef.current=state;
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
          projects: [], people: DEFAULT_PEOPLE, templates: DEFAULT_TEMPLATES, intakes: [], tasks: [], ratings: {}, meetings: [], siteVisits: [], scopeSheet: PROJECT_SCOPE_SHEET_ROWS
        });
      } catch {
        localState = normalizeStudioState({
          projects: [], people: DEFAULT_PEOPLE, templates: DEFAULT_TEMPLATES, intakes: [], tasks: [], ratings: {}, meetings: [], siteVisits: [], scopeSheet: PROJECT_SCOPE_SHEET_ROWS
        });
      }

      try {
        const user = await projectApi.getCurrentUser();
        setCurrentUser(user);
        localState={...localState,currentUser:user,pendingProjectCreates:(localState.pendingProjectCreates||[]).filter(j=>j.ownerEmail===user.email),pendingReceivedUploads:(localState.pendingReceivedUploads||[]).filter(j=>j.ownerEmail===user.email)};
        if (!user?.authorized) {
          setBackendErr(user?.message || "Admin access required.");
          localState = { ...localState, currentUser: user, accessDenied: true };
          setState(localState);
          return;
        }

        if(user.appAccess.toLowerCase()!=="admin"){
          const [remote,contacts,work,zones,people,workspace,templates]=await Promise.all([projectApi.listAll(),projectApi.listContacts(),projectApi.listLineOfWork(),projectApi.listFloorZones(),projectApi.listProjectPeople(),projectApi.getProjectWorkspace(),projectApi.listDrawingTaskMaster()]);
          const projects=(remote||[]).map(r=>{
            const base=backendProjectToFrontend(r,{}),id=String(r.projectId);
            const profile=contactRowsToObject((contacts||[]).filter(c=>String(c.projectId)===id));
            const plan=(work||[]).filter(x=>String(x.projectId)===id).map(x=>({...x,id:x.lineWorkId}));
            const areas=(zones||[]).filter(x=>String(x.projectId)===id);
            return {...base,contacts:profile,lineOfWorkResidence:plan,lineOfWork:plan,floorZones:areas};
          });
          localState={...localState,projects,people:people.map(m=>m.name),teamMaster:people.length?people:[{userId:user.userId,name:user.name,active:true}],templates,intakes:workspaceIntakes(workspace),tasks:[],ratings:{},meetings:workspace.meetings||[],siteVisits:[],scopeSheet:[],currentUser:user};
          setState(localState);return;
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
        if (!Array.isArray(remote)) throw new Error("Invalid project list from Google Sheets.");
        if (Array.isArray(remote)) {
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
        const workspace=await projectApi.getProjectWorkspace();
        const remoteMeetings=workspace.meetings||[],knownMeetingIds=new Set(workspace.meetingIds||remoteMeetings.map(m=>m.id));
        localState={...localState,intakes:workspaceIntakes(workspace),meetings:[...remoteMeetings,...(localState.meetings||[]).filter(m=>!knownMeetingIds.has(m.id)&&m.active!==false)]};
        setBackendErr("");
      } catch (err) {
        localState={projects:[],people:[],tasks:[],intakes:[],currentUser:null,accessDenied:true};
        setBackendErr(err?.message || "Could not verify access to the backend");
      } finally {
        setState(localState);
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (update) => {
    const before=stateRef.current;
    const next=typeof update==='function'?update(before):update;
    if(currentUser?.appAccess?.toLowerCase()!=="admin"){
      const resolved=mergeMemberState(before,next,currentUser);stateRef.current=resolved;setState(resolved);
      const ok=await localStateSet(STORE_KEY,JSON.stringify(resolved));setSaveErr(!ok);return resolved;
    }
    stateRef.current=next;setState(next);
    const ok = await localStateSet(STORE_KEY, JSON.stringify(next));
    setSaveErr(!ok);
    return next;
  }, [currentUser]);

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
        <div style={val}>Enlighten Design Co.</div>
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
function drawingRegisterCoverage(row,project){
  const areas=project.floorZones||Object.entries(project.zones||{}).map(([zoneCode,z])=>({zoneCode,floor:z.floor,area:z.room}));
  const coverage=row.coverage||[];
  const floors=[...new Set(coverage.map(c=>c.floor).filter(Boolean))];
  return floors.map(floor=>{
    const selected=coverage.filter(c=>c.floor===floor),known=areas.filter(a=>String(a.floor)===String(floor));
    const full=selected.some(c=>!c.area)||(known.length>0&&known.every(a=>selected.some(c=>String(c.area).trim().toLowerCase()===String(a.area||a.room).trim().toLowerCase())));
    const tag=c=>{const saved=known.find(a=>String(a.area||a.room).trim().toLowerCase()===String(c.area).trim().toLowerCase());if(saved?.tag||saved?.category)return saved.tag||saved.category;const name=String(c.area||'');return /bedroom|bed room/i.test(name)?'Bedroom':/toilet|washroom|bathroom|powder/i.test(name)?'Toilets':/kitchen|pantry/i.test(name)?'Kitchen':/stair/i.test(name)?'Staircase':/office|meeting|md room|md cabin/i.test(name)?'Office':/living|lounge|lobby|dining|dinning|reception|porch/i.test(name)?'Social Spaces':/puja|pooja|mandir/i.test(name)?'Mandir':name;};
    const summary=full?(row.drawingType||'Layout'):[...new Set(selected.map(tag).filter(Boolean))].join(' ∞ ');
    return {floor,summary:`${floor} | ${summary||row.drawingType||'Drawing'}`,details:selected.map(c=>{const z=known.find(a=>String(a.area||a.room).trim().toLowerCase()===String(c.area||'').trim().toLowerCase());return {floor,zoneCode:c.zoneCode||z?.zoneCode||'',area:c.area||'Whole floor'};})};
  });
}

function buildDrawingRegister(project,data){
  const drawings=(data.drawings||[]).filter(d=>String(d.projectId)===String(project.id));
  const files=(data.files||[]).filter(f=>String(f.projectId)===String(project.id));
  const tasks=(data.tasks||[]).filter(t=>String(t.projectId)===String(project.id));
  const parse=v=>{if(Array.isArray(v))return v;try{const a=JSON.parse(v||'[]');return Array.isArray(a)?a:[];}catch{return [];}};
  const groups=new Map(),byDrawing=new Map();
  const addCoverage=(entry,r)=>{const list=r.area?[{floor:r.floor,area:r.area,zoneCode:r.zoneCode||''}]:parse(r.floorTags).length?parse(r.floorTags).map(f=>({floor:f,area:''})):String(r.floor||'').split(',').map(f=>({floor:f.trim(),area:''}));list.filter(c=>c.floor).forEach(c=>{if(!entry.coverage.some(a=>a.floor===c.floor&&a.area===c.area))entry.coverage.push(c);});};
  for(const d of drawings){
    if(String(d.direction||'Received').toLowerCase()==='sent')continue;
    const file=files.find(f=>f.linkedEntityId===d.drawingId)||files.find(f=>d.driveFileId&&f.driveFileId===d.driveFileId);
    const key=JSON.stringify([d.driveFileId||file?.driveFileId||d.drawingId,d.revisionNo||'',d.drawingType||'']);
    if(!groups.has(key))groups.set(key,{id:key,date:d.receivedSentDate||d.createdAt||file?.uploadedAt||'',fileName:d.fileName||file?.fileName||'Drawing',drawingType:d.drawingType||'',revisionNo:d.revisionNo??'',driveUrl:d.driveUrl||file?.driveUrl||'',mimeType:d.mimeType||file?.mimeType||'',coverage:[],sent:[]});
    const row=groups.get(key);addCoverage(row,d);byDrawing.set(String(d.drawingId),row);
  }
  // Additional received file rows without a Drawing_Register counterpart remain visible.
  for(const f of files.filter(f=>String(f.direction).toLowerCase()==='received')){
    if(drawings.some(d=>f.linkedEntityId===d.drawingId||(f.driveFileId&&f.driveFileId===d.driveFileId)))continue;
    const key=String(f.fileId||f.driveFileId);if(groups.has(key))continue;
    const row={id:key,date:f.uploadedAt||'',fileName:f.fileName||'Drawing',drawingType:f.drawingType||'',revisionNo:f.revisionNo??'',driveUrl:f.driveUrl||'',mimeType:f.mimeType||'',coverage:[],sent:[]};addCoverage(row,f);groups.set(key,row);
  }
  // Classified area rows supersede the upload's whole-floor tags for the same file.
  for(const r of groups.values())r.coverage=r.coverage.filter(c=>c.area||!r.coverage.some(a=>a.floor===c.floor&&a.area));
  const sentSeen=new Map(),standalone=[];
  for(const f of [...files.filter(f=>String(f.direction).toLowerCase()==='sent'),...drawings.filter(d=>String(d.direction).toLowerCase()==='sent')]){
    const key=JSON.stringify([f.driveFileId||f.fileId||f.drawingId,f.revisionNo||'',f.drawingType||'']);if(sentSeen.has(key)){addCoverage(sentSeen.get(key),f);continue;}
    const task=tasks.find(t=>String(t.designTaskId)===String(f.linkedEntityId||f.designTaskId));
    const row={id:key,date:f.receivedSentDate||f.uploadedAt||f.createdAt||task?.completedAt||'',fileName:f.fileName||task?.taskType||'Sent drawing',drawingType:f.drawingType||task?.taskType||'',revisionNo:f.revisionNo??'',driveUrl:f.driveUrl||'',mimeType:f.mimeType||'',coverage:[]};
    addCoverage(row,{...f,floor:f.floor||task?.floor,area:f.area||task?.area});sentSeen.set(key,row);
    const source=byDrawing.get(String(f.sourceDrawingId||task?.sourceDrawingId||''));if(source)source.sent.push(row);else standalone.push({id:`sent-${key}`,received:null,sent:[row]});
  }
  return [...[...groups.values()].map(r=>({id:r.id,received:r,sent:r.sent})),...standalone].sort((a,b)=>String(b.received?.date||b.sent[0]?.date||'').localeCompare(String(a.received?.date||a.sent[0]?.date||'')));
}

function drawingFileType(row){
  const name=String(row.fileName||'').split(/[?#]/)[0].trim();
  const ext=name.match(/\.([a-z0-9]+)$/i)?.[1]?.toUpperCase();
  if(ext)return ext==='JPG'||ext==='JPE'?'JPEG':ext;
  const mime=String(row.mimeType||'').toLowerCase();
  if(mime.includes('pdf'))return 'PDF';
  if(mime.includes('jpeg')||mime.includes('jpg'))return 'JPEG';
  if(mime.includes('dwg')||mime.includes('acad'))return 'DWG';
  if(mime.includes('png'))return 'PNG';
  return 'FILE';
}

function DrawingCoverage({row,project}){
  const floors=drawingRegisterCoverage(row,project);
  if(!floors.length)return <span style={{color:T.inkDim}}>Not tagged</span>;
  return <div style={{display:'grid',gap:8}}>{floors.map(f=><details key={f.floor} style={{display:'block'}}><summary style={{cursor:'pointer',fontWeight:500,lineHeight:1.5}}>{f.summary}</summary><div style={{marginTop:8,maxHeight:220,overflowY:'auto'}}>{f.details.map((c,i)=><div key={i} style={{padding:'6px 0',borderTop:`1px solid ${T.line}`,fontSize:12}}>{c.zoneCode&&<strong>{c.zoneCode} · </strong>}{c.floor} | {c.area}</div>)}</div></details>)}</div>;
}

function ReceivedSentView({state}){
  const [projectId,setProjectId]=useState(state.projects?.[0]?.id||'');
  const [result,setResult]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[query,setQuery]=useState(''),[revision,setRevision]=useState(0);
  const project=(state.projects||[]).find(p=>String(p.id)===String(projectId));
  useEffect(()=>{let live=true;setResult(null);setError('');if(!projectId){setLoading(false);return;}setLoading(true);projectApi.listDrawingRegister(projectId).then(data=>{if(live)setResult({projectId,data});}).catch(err=>{if(live)setError(err.message||'Could not load drawing register.');}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[projectId,revision]);
  const groups=project&&result?.projectId===projectId?buildDrawingRegister(project,result.data):[];
  const filtered=groups.filter(g=>[g.received,...g.sent].filter(Boolean).some(r=>[r.fileName,r.drawingType,r.revisionNo,...r.coverage.flatMap(c=>[c.floor,c.area])].join(' ').toLowerCase().includes(query.toLowerCase())));
  const cell={padding:'12px 10px',border:`1px solid ${T.line}`,verticalAlign:'top',textAlign:'left',fontFamily:FONT_BODY,fontSize:12,lineHeight:1.5,overflowWrap:'anywhere'};
  const head={...cell,background:'#D2CDC1',color:T.ink,fontFamily:FONT_MONO,fontSize:10,fontWeight:700,border:'1px solid #9D998F',borderBottom:'1px solid #B8B5AC'};
  const safeLink=url=>{try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}};
  const link=r=>safeLink(r.driveUrl)?<a href={safeLink(r.driveUrl)} target="_blank" rel="noreferrer" aria-label={`Open ${drawingFileType(r)} file ${r.fileName}`} style={{color:T.blue,fontWeight:600,whiteSpace:'nowrap'}}>{drawingFileType(r)}</a>:<span style={{color:T.inkDim}}>No file link</span>;
  return <section style={{fontFamily:FONT_BODY}}><h2 style={{fontFamily:FONT_DISPLAY,margin:'4px 0 8px'}}>Received / Sent</h2><p style={{fontSize:13,color:T.inkDim}}>Project drawing register. Expand a floor summary to see every selected zone. Sent files are recorded design outputs; opening this page does not send files.</p>
    <div style={{display:'flex',gap:12,alignItems:'flex-end',flexWrap:'wrap',marginBottom:16}}><label style={{display:'grid',gap:6,fontSize:12,flex:'1 1 320px'}}>Project<select aria-label="Drawing register project" value={projectId} onChange={e=>{setProjectId(e.target.value);setQuery('');}} style={inputStyle}><option value="">Select a project…</option>{(state.projects||[]).map(p=><option key={p.id} value={p.id}>{p.no||''} · {p.name}{p.status==='Completed'||p.completedAt?' · Completed':''}</option>)}</select></label><input aria-label="Search drawing register" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search drawing, floor, area, type or revision" style={{...inputStyle,flex:'1 1 260px'}}/><button type="button" style={smallBtn} disabled={loading||!projectId} onClick={()=>setRevision(n=>n+1)}>Refresh</button></div>
    {loading&&<p role="status" style={{fontFamily:FONT_BODY,fontSize:13,fontWeight:400,lineHeight:1.5,color:T.inkDim,margin:"12px 0"}}>Loading drawing register…</p>}{error&&<p role="alert" style={{color:T.redline}}>{error} Update and redeploy the included Apps Script backend, then click Refresh.</p>}
    {project&&!loading&&!error&&result&&<><p style={{fontSize:12,color:T.inkDim}}>{groups.filter(g=>g.received).length} received file(s) · {groups.reduce((n,g)=>n+g.sent.length,0)} sent file(s)</p><div style={{overflowX:'auto'}}><table style={{width:'100%',minWidth:1380,borderCollapse:'collapse',tableLayout:'fixed'}}><colgroup>{[85,125,205,85,190,60,80,205,160,60,85,80].map((w,i)=><col key={i} style={{width:w}}/>)}</colgroup><thead><tr><th colSpan={7} style={{...head,background:'#D2CDC1',textAlign:'center',fontSize:12,borderRight:`3px solid ${T.ink}`}}>RECEIVED</th><th colSpan={5} style={{...head,background:T.navy,color:'#fff',textAlign:'center',fontSize:12,borderLeft:`3px solid ${T.ink}`}}>SENT</th></tr><tr>{['Date','Project','Floor / Zones','Type','Drawing Name','Rev No.','Link','Floor / Type','Drawing Name','Rev No.','Issue Date','Link'].map((h,i)=><th key={i} style={{...head,...(i===7?{borderLeft:`3px solid ${T.ink}`}:{})}}>{h}</th>)}</tr></thead><tbody>{filtered.flatMap(g=>Array.from({length:Math.max(1,g.sent.length)},(_,i)=>{const r=g.received,sent=g.sent[i],span=Math.max(1,g.sent.length);return <tr key={`${g.id}-${i}`} style={{background:i%2?'#fff':'transparent'}}>{i===0&&(r?<><td rowSpan={span} style={cell}>{formatProjectDate(r.date)}</td><td rowSpan={span} style={cell}>{project.no||project.name}</td><td rowSpan={span} style={cell}><DrawingCoverage row={r} project={project}/></td><td rowSpan={span} style={cell}>{r.drawingType||'—'}</td><td rowSpan={span} style={cell}>{r.fileName}</td><td rowSpan={span} style={cell}>{r.revisionNo!==''?r.revisionNo:'—'}</td><td rowSpan={span} style={{...cell,borderRight:`3px solid ${T.ink}`}}>{link(r)}</td></>:<td colSpan={7} rowSpan={span} style={{...cell,color:T.inkDim}}>Sent drawing · no received source linked</td>)}{sent?<><td style={{...cell,borderLeft:`3px solid ${T.ink}`}}><DrawingCoverage row={sent} project={project}/><div style={{fontSize:11,color:T.inkDim,marginTop:6}}>{sent.drawingType}</div></td><td style={cell}>{sent.fileName}</td><td style={cell}>{sent.revisionNo!==''?sent.revisionNo:'—'}</td><td style={cell}>{formatProjectDate(sent.date)}</td><td style={cell}>{link(sent)}</td></>:<td colSpan={5} style={{...cell,color:T.inkDim,borderLeft:`3px solid ${T.ink}`}}>No sent drawing linked yet</td>}</tr>;}))}{!filtered.length&&<tr><td colSpan={12} style={cell}>No drawings found for this project{query?' matching your search':''}.</td></tr>}</tbody></table></div></>}
  </section>;
}

const RECEIVED_UPLOAD_JOBS=new Map();
let receivedUploadChain=Promise.resolve();
const uploadFileBase64=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||'').split(',')[1]||'');reader.onerror=()=>reject(Error('Could not read this file. Select it again.'));reader.readAsDataURL(file);});
function runReceivedUploadJob(persist,job,file){
  let entry=RECEIVED_UPLOAD_JOBS.get(job.id);
  if(entry?.work)return entry.work;
  if(!entry){entry={file};RECEIVED_UPLOAD_JOBS.set(job.id,entry);}else if(file)entry.file=file;
  const generation=AUTH_SESSION_GENERATION;
  const update=patch=>generation===AUTH_SESSION_GENERATION?persist(latest=>({...latest,pendingReceivedUploads:(latest.pendingReceivedUploads||[]).map(j=>j.id===job.id?{...j,...patch}:j)})):Promise.resolve();
  const work=receivedUploadChain.catch(()=>{}).then(async()=>{
    if(generation!==AUTH_SESSION_GENERATION)return;
    try{
      if(!entry.file)throw Error('Select the same file again to resume this upload.');
      const metadata={...job.metadata,drawingId:job.id};
      let saved;
      await update({status:'uploading',error:'',progress:0,phase:'Preparing drawing…'});
      if(entry.file.size<=2*1024*1024){
        const fileBase64=await uploadFileBase64(entry.file);
        await update({phase:'Saving to Google Drive and Sheets…'});
        saved=await apiRequest('receiveDrawing',{...metadata,fileBase64},'POST',180000);
      }else{
        if(!entry.session){
          await update({phase:'Opening Google Drive upload…'});
          entry.session=await apiRequest('beginReceivedUpload',metadata,'POST',120000);
        }
        if(entry.session.drawing)saved=entry.session.drawing;
        else{
          // Probe on each retry so bytes accepted before a lost response are not sent again.
          let result=entry.completion||await apiRequest('uploadReceivedChunk',{uploadTicket:entry.session.uploadTicket,probe:true},'POST',90000);
          let stalled=0;
          while(!result.complete){
            if(generation!==AUTH_SESSION_GENERATION)return;
            const offset=result.nextOffset,end=Math.min(offset+entry.session.chunkBytes,entry.file.size);
            if(offset>=end)throw Error('Drive has not confirmed upload completion. Retry to check its status.');
            await update({progress:Math.floor(offset/entry.file.size*100),phase:'Uploading drawing parts…'});
            const chunk=await uploadFileBase64(entry.file.slice(offset,end));
            const next=await apiRequest('uploadReceivedChunk',{uploadTicket:entry.session.uploadTicket,offset,chunk},'POST',90000);
            stalled=next.nextOffset<=offset?stalled+1:0;if(stalled>1)throw Error('Upload progress stopped. Retry to resume.');
            result=next;
          }
          entry.completion=result;
          await update({progress:100,phase:'File uploaded · saving drawing register…'});
          saved=await apiRequest('finishReceivedUpload',{completionTicket:result.completionTicket},'POST',120000);
        }
      }
      if(generation!==AUTH_SESSION_GENERATION)return;
      const newIntake={id:saved.drawingId,projectId:metadata.projectId,floor:metadata.floors.join(', '),floors:metadata.floors,zone:'',areas:[],drawingType:canonicalDrawingType(metadata.drawingType),fileName:metadata.fileName,driveUrl:saved.driveUrl||'',note:metadata.notes,date:saved.receivedSentDate||metadata.receivedSentDate,uploadedAt:saved.createdAt||new Date().toISOString(),classified:saved.classified===true||String(saved.classified)==='true',source:'Received Upload'};
      await persist(latest=>({...latest,intakes:[newIntake,...(latest.intakes||[]).filter(i=>i.id!==newIntake.id)],pendingReceivedUploads:(latest.pendingReceivedUploads||[]).filter(j=>j.id!==job.id)}));
      RECEIVED_UPLOAD_JOBS.delete(job.id);
    }catch(e){
      if(/session.*expired|invalid or expired/i.test(e.message)){entry.session=null;entry.completion=null;}
      await update({status:'error',error:e.message||'Upload could not be confirmed. Retry to check or resume it.'});
    }finally{entry.work=null;}
  });
  entry.work=work;receivedUploadChain=work;return work;
}
function PendingReceivedUploads({state,persist}){
  const jobs=state.pendingReceivedUploads||[];
  if(!jobs.length)return null;
  return <div style={{display:'grid',gap:10,marginBottom:18,fontFamily:FONT_BODY,fontSize:13}}><div style={{color:T.inkDim}}>Uploads continue while you use other pages. Keep this browser tab open until they finish.</div>{jobs.map(job=>{
    const entry=RECEIVED_UPLOAD_JOBS.get(job.id),running=!!entry?.work;
    const retry=file=>runReceivedUploadJob(persist,job,file);
    return <div key={job.id} role={job.error?'alert':'status'} style={{padding:12,border:`1px solid ${T.line}`,background:T.paperDim}}><strong>{job.metadata.fileName}</strong><div style={{marginTop:4,color:job.error?T.redline:T.inkDim}}>{job.error|| (running?(job.phase||'Waiting for another upload…'):'Upload interrupted. Retry to check or resume it.')}</div>{running&&<progress aria-label={`Upload progress ${job.metadata.fileName}`} max="100" value={job.progress>0?job.progress:undefined} style={{width:'100%',marginTop:8}}/>}{!running&&(entry?.file?<button type="button" style={{...smallBtn,marginTop:8}} onClick={()=>retry()}>Retry upload</button>:<label style={{display:'block',marginTop:8}}>Select the same file to retry<input type="file" onChange={e=>{const f=e.target.files?.[0];if(!f)return;if(f.name!==job.metadata.fileName||f.size!==job.metadata.fileSize){alert('Choose the same drawing file for this upload.');return;}retry(f);}}/></label>)}</div>;
  })}</div>;
}
function UploadView({ state, persist }) {
  // Keep this helper local: ProjectsView has its own helper that is not in scope here.
  const uploadProjectIsCompleted = p =>
    p?.status === "Completed" ||
    p?.projectControl?.projectStatus === "Completed" ||
    Boolean(p?.completedAt);
  const activeProjects=(state.projects||[]).filter(p=>!uploadProjectIsCompleted(p));
  const [projectId, setProjectId] = useState(activeProjects[0]?.id || "");
  const [floors, setFloors] = useState([]);
  const [drawingType, setDrawingType] = useState(canonicalDrawingType((state.templates||DEFAULT_TEMPLATES)[0]?.drawingType || "Layout"));
  const [file, setFile] = useState(null);
  const [note, setNote] = useState("");
  const saving=false;
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
    ["terrace","Terrace"],["facade","Facade"],["landscape","Landscape"],
    ["bath_elevation","Bath Elevation"],["wardrobe","Furniture"],["art_curation","Art Curation"]];
  const availableFloors=(()=>{
    const ps=project?.scope||{};
    return floorDefs.filter(([key])=>Boolean(ps[key])).map(([,label])=>label);
  })();

  useEffect(()=>{
    let live=true;
    setFloors([]);
    if(!projectId)return;
    return()=>{live=false;};
  },[projectId]);

  useEffect(()=>{
    setFloors(current=>current.filter(f=>availableFloors.includes(f)));
  },[projectId,project?.scope]);

  const submitLock=useRef(false);
  const submit = () => {
    if(!projectId||!floors.length||!drawingType||!file||submitLock.current)return;
    if(!file.size){alert('Choose a non-empty drawing file.');return;}
    submitLock.current=true;
    const metadata={projectId,floor:floors.join(', '),floors:[...floors],area:'',drawingType,fileName:file.name,mimeType:file.type||'application/octet-stream',fileSize:file.size,notes:note,receivedSentDate:todayISO()};
    const duplicate=(state.pendingReceivedUploads||[]).some(j=>j.metadata.projectId===projectId&&j.metadata.fileName===file.name&&j.metadata.fileSize===file.size&&JSON.stringify(j.metadata.floors)===JSON.stringify(floors));
    if(duplicate){submitLock.current=false;alert('This drawing is already in the upload queue. Use its Retry button if needed.');return;}
    const job={id:'DRW-UPL-'+crypto.randomUUID(),metadata,ownerEmail:state.currentUser?.email||'',status:'queued',phase:'Waiting to upload…',progress:0};
    const selectedFile=file;
    const savedLocally=persist(latest=>({...latest,pendingReceivedUploads:[...(latest.pendingReceivedUploads||[]),job]}));
    setFile(null);setNote('');if(fileRef.current)fileRef.current.value='';
    setJustAdded(true);setTimeout(()=>setJustAdded(false),2200);
    Promise.resolve(savedLocally).then(()=>{submitLock.current=false;return runReceivedUploadJob(persist,job,selectedFile);}).catch(e=>alert(e.message)).finally(()=>{submitLock.current=false;});
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

        <Field label="Floors in this drawing — select all that apply">
          <div style={{display:'flex',flexWrap:'wrap',gap:12,padding:12,border:`1px solid ${T.line}`,fontFamily:FONT_BODY,fontSize:12,color:T.ink}}>{availableFloors.map(f=><label key={f} style={{display:'inline-flex',alignItems:'center',gap:4}}><input type="checkbox" aria-label={`Upload floor ${f}`} checked={floors.includes(f)} disabled={saving} onChange={e=>setFloors(current=>e.target.checked?[...new Set([...current,f])]:current.filter(x=>x!==f))}/> {f}</label>)}</div>
          <div style={{fontSize:12,color:T.inkDim,marginTop:6}}>{floors.length?`${floors.length} floor(s) tagged: ${floors.join(', ')}`:'Select at least one floor. One file can cover several floors.'}</div>
          {project && availableFloors.length===0 && <div style={{fontSize:11,color:T.redline,marginTop:5}}>No floors selected for this project in Projects & Scope.</div>}
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
        <Btn onClick={submit} disabled={!file||!floors.length||saving}>
          <Upload size={14} /> {saving?"Uploading to Google Drive…":"Log received drawing"}
        </Btn>
        {justAdded && <div style={{ marginTop: 12, fontFamily: FONT_MONO, fontSize: 12, color: T.green }}>Added to the upload queue. It will appear for classification after Google Drive and Sheets confirm the save.</div>}
      </div>

      <div>
        <PendingReceivedUploads state={state} persist={persist}/><h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, margin: "4px 0 18px", color: T.ink }}>Awaiting classification ({pending.length})</h2>
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
  const baseProject = intake && state.projects.find((p) => p.id === intake.projectId);
  const project = baseProject ? {...baseProject,zones:{...(baseProject.zones||{}),...Object.fromEntries((baseProject.floorZones||[]).filter(z=>z.zoneCode).map(z=>[z.zoneCode,{floor:z.floor,room:z.area||z.room}]))}} : null;
  const letters = project ? sortedZoneLetters(project) : [];
  const floors=[...new Set(letters.map(z=>project.zones[z]?.floor).filter(Boolean))];
  const toggleFloor=(floor,checked)=>{const ids=letters.filter(z=>project.zones[z]?.floor===floor);setZones(current=>checked?[...new Set([...current,...ids])]:current.filter(z=>!ids.includes(z)));};

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
      if(new Set(zones.map(z=>project.zones?.[z]?.floor||intake.floor)).size>1){
        let capabilities;try{capabilities=await projectApi.getWorkflowCapabilities();}catch(_){throw new Error("Install the updated Apps Script backend before classifying a package across multiple floors.");}
        if(!capabilities?.multiFloorCoverage)throw new Error("The connected backend does not support multi-floor drawing packages.");
      }
      const saved = await projectApi.classifyDrawing({
        drawingId: selectedId, projectId: project.id, floor: intake.floor,
        areas: areaNames, coverage:zones.map(z=>({floor:project.zones?.[z]?.floor||intake.floor,area:project.zones?.[z]?.room||z})), drawingType:lockedDrawingType
      });
      const backendTasks = Array.isArray(saved?.tasks) ? saved.tasks.map(t => ({
        id:t.designTaskId||uid(), designTaskId:t.designTaskId, designNo:t.designNo,
        projectId:project.id, projectName:project.name, zones:[t.area||""], drawingType:lockedDrawingType,
        title:t.taskType||t.title||"Design Task", assignee:t.assigneeName||"", status:t.status||STATUS.TODO,
        date:todayISO(), hours:Number(t.actualHours||0), sourceFile:intake.fileName
      })) : newTasks;
      const nextIntakes = state.intakes.map((i) => i.id === selectedId ? { ...i, classified: true, zones, floors:[...new Set(zones.map(z=>project.zones[z].floor))], coverage:zones.map(z=>({floor:project.zones[z].floor,area:project.zones[z].room||z})), areas:areaNames, drawingType:lockedDrawingType } : i);
      await persist({ ...state, intakes: nextIntakes, tasks: [...backendTasks, ...state.tasks] });
    } catch(err) {
      alert(`Classification failed: ${err?.message||err}`); return;
    }
    setZones([]); setDone(true);
    setTimeout(() => setDone(false), 2400);
  };

  const activeTemplate = state.templates.find((t) => drawingTypeKey(t.drawingType) === drawingTypeKey(lockedDrawingType));
  const workflowTriggers = [...new Map((project?.lineOfWorkResidence||project?.lineOfWork||[]).filter(r=>String(r.workflowVersion)==="1"&&r.scope!=="Project"&&drawingTypeKey(r.triggerDrawingType)===drawingTypeKey(lockedDrawingType)).filter((r,i,all)=>all.findIndex(x=>x.triggerTaskType===r.triggerTaskType)===i).map(r=>[r.triggerTaskType,{title:r.triggerTaskType,assignee:r.responsible||"Unassigned"}])).values()];
  const previewTasks = [...(activeTemplate?.tasks||[]),...workflowTriggers.filter(t=>!(activeTemplate?.tasks||[]).some(x=>x.title===t.title))].map(t=>({...t,assignee:workflowTriggers.find(x=>x.title===t.title)?.assignee||t.assignee}));

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

        <Field label={`Zone(s) — select every floor / area this drawing package covers`}>
          {letters.length === 0 ? (
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.redline, background: T.redlineBg, padding: "10px 12px", borderRadius: 6 }}>
              This project has no zones mapped yet on the Floor | Zone sheet — add its floor/zone breakdown there first.
            </div>
          ) : (
            <div style={{fontFamily:FONT_BODY,fontSize:12,color:T.ink}}><p style={{fontSize:12,color:T.inkDim}}>Select one or more floors. Each floor selects its areas; untick any area not covered by this drawing.</p>{floors.map(f=>{
              const ids=letters.filter(z=>project.zones[z]?.floor===f),selected=ids.filter(z=>zones.includes(z));
              return <fieldset key={f} style={{border:`1px solid ${T.line}`,padding:12,marginBottom:12}}><legend style={{fontFamily:FONT_BODY,fontSize:12}}><label><input type="checkbox" aria-label={`Classify floor ${f}`} checked={selected.length>0} onChange={e=>toggleFloor(f,e.target.checked)}/> {f} <span style={{fontSize:11}}>({selected.length}/{ids.length} areas)</span></label></legend><div style={{display:'flex',gap:12,flexWrap:'wrap',fontFamily:FONT_BODY,fontSize:12}}>{ids.map(z=><label key={z} style={{display:'inline-flex',alignItems:'center',gap:4}}><input type="checkbox" aria-label={`Classify area ${f} ${project.zones[z].room||z}`} checked={zones.includes(z)} onChange={()=>toggleZone(z)}/> {z} · {project.zones[z].room||z}</label>)}</div></fieldset>;
            })}</div>
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

        {previewTasks.length > 0 && (
          <div style={{ background: T.paperDim, border: `1px solid ${T.line}`, borderRadius: 8, padding: "12px 14px", marginBottom: 20 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.inkDim, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Will auto-open</div>
            {previewTasks.map((t, idx) => (
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
  const assignProject=id=>state.currentUser?.appAccess?.toLowerCase()!=="viewer"&&projectRole(state,id)==="Admin";
  const canAssign=(state.projects||[]).some(p=>assignProject(p.id));
  const canWork=canAssign||state.currentUser?.permissions?.wih==="own-edit";
  const [person, setPerson] = useState("All");
  const [taskSection, setTaskSection] = useState("Pending");
  const WIH_CACHE_KEY = "enlighten_wih_permissions_v21115:"+String(state.currentUser?.userId||state.currentUser?.googleSubject||"anonymous");
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
      // Only admins may augment WIH with project-wide dashboard records.
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
      const projects=(state.projects||[]).filter(p=>assignProject(p.id)&&!p.completed&&!/completed/i.test(String(p.projectStatus||p.status||"")));
      const dashboards=canAssign?await Promise.all(projects.map(async p=>{
        try{return {p,payload:await projectApi.getDesignDashboard(p.id)};}catch(e){console.warn("WIH dashboard sync failed",p.id,e);return {p,payload:null};}
      })):[];
      dashboards.forEach(({p,payload})=>{
        const rows=Array.isArray(payload?.rows)?payload.rows:[];
        rows.forEach(r=>taskDefs.forEach(d=>{
          const taskId=String(r?.[d.id]||"").trim();
          const designNo=String(r?.[d.no]||"").trim();
          if(!taskId&&!designNo)return;
          const key=taskId||designNo;
          const existing=byId.get(key)||base.find(x=>String(x?.task?.designNo||"")===designNo);
          if(existing){
            byId.set(key,{...existing,designTaskId:taskId||existing.designTaskId,projectId:p.id,task:{...(existing.task||{}),taskType:existing.task?.taskType || d.title,projectName:p.name,floor:r.floor||existing.task?.floor||"",area:r.area||existing.task?.area||"",dependencyDrawingType:d.drawingType,designNo:designNo||existing.task?.designNo||"",status:r?.[d.st]||existing.task?.status||existing.status||"Not Started"},status:r?.[d.st]||existing.status||existing.task?.status||"Not Started"});
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

  const visibleRemoteTasks=remoteTasks.filter(r=>state.currentUser?.appAccess?.toLowerCase()==='admin'||projectRole(state,r.projectId)&&(assignProject(r.projectId)||String(r.assigneeUserId)===String(state.currentUser?.userId)));
  const displayTasks=visibleRemoteTasks.length?visibleRemoteTasks.map(r=>({
    ...r,
    id:r.designTaskId,
    designTaskId:r.designTaskId,
    projectId:r.projectId,
    title:r.task?.taskType||"Design Task",
    taskCategory:r.task?.taskCategory||'',meetingMode:r.task?.meetingMode||'',meetingChannel:r.task?.meetingChannel||'',meetingLink:r.task?.meetingLink||'',
    optional:r.task?.optional===true||String(r.task?.optional)==="true",
    drawingReviewRequired:r.task?.drawingReviewRequired===true||String(r.task?.drawingReviewRequired)==="true",
    milestone:r.task?.milestone||"", parentTask:r.task?.parentTask||"", parentDesignTaskId:r.task?.parentDesignTaskId||"",
    predecessorTaskId:r.task?.predecessorTaskId||"", completionUploadRequired:r.completionUploadRequired !== false && String(r.completionUploadRequired)!=="false",
    projectName:(state.projects||[]).find(p=>String(p.id)===String(r.projectId))?.name||r.task?.projectName||"",
    floor:r.task?.floor||"",
    area:r.task?.area||"",
    drawingType:r.task?.dependencyDrawingType||"",
    designNo:r.task?.designNo||"",
    assignee:r.assigneeName||r.task?.assigneeName||"",
    hours:Number(r.totalMinutes||0)/60,
    status:String(r.status||r.task?.status||"Not Started")
  })):(state.tasks||[]).filter(t=>assignProject(t.projectId));
  const isDone=s=>/completed|done/i.test(String(s));
  const isProgress=s=>/in progress/i.test(String(s));
  const isPaused=s=>/paused/i.test(String(s));
  const isBlocked=s=>/blocked/i.test(String(s));
  const sectionCounts={
    Pending:displayTasks.filter(t=>!isDone(t.status)&&!!t.assignee).length,
    Completed:displayTasks.filter(t=>isDone(t.status)).length,
    Unallotted:displayTasks.filter(t=>!isDone(t.status)&&!t.assignee).length,
    All:displayTasks.length
  };
  const sectionTasks=displayTasks.filter(t=>taskSection==="All"?true:taskSection==="Completed"?isDone(t.status):taskSection==="Unallotted"?!isDone(t.status)&&!t.assignee:!isDone(t.status)&&!!t.assignee);
  const tasks=sectionTasks.filter(t=>person==="All"||t.assignee===person);
  const people=[...new Set([...(teamNames.length?teamNames:(state.people||[])),...displayTasks.map(t=>t.assignee).filter(Boolean)])];
  const bulkProjects=[...new Map(displayTasks.filter(t=>assignProject(t.projectId)&&!isDone(t.status)).map(t=>[String(t.projectId),{id:String(t.projectId),name:t.projectName||String(t.projectId)}])).values()];
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
    try{if(kind==="start")await projectApi.startTask(t.designTaskId);if(kind==="pause")await projectApi.pauseTask(t.designTaskId);if(kind==="resume")await projectApi.resumeTask(t.designTaskId );if(kind==="review")await projectApi.acknowledgeWorkflowDrawing(t.designTaskId);if(kind==="skip")await projectApi.skipWorkflowSubtask(t.designTaskId);await refresh(true);}
    catch(e){alert(`Task update failed: ${e?.message||e}`);}finally{setBusyId("");}
  };
  const fileToBase64=f=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||"").split(",")[1]||"");r.onerror=reject;r.readAsDataURL(f);});
  const finish=async()=>{
    const x=completeEditor;if(!x)return; if(x.task.completionUploadRequired!==false&&!x.file)return alert("Please upload the completed drawing/file.");
    const hrs=Number(x.actualHours);if(!hrs||hrs<=0)return alert("Please enter actual time taken in hours.");
    setBusyId(x.task.designTaskId);
    try{const upload=x.file?{fileName:x.file.name,mimeType:x.file.type||"application/octet-stream",fileBase64:await fileToBase64(x.file)}:{};await projectApi.completeTask({designTaskId:x.task.designTaskId,...upload,actualHours:hrs,notes:x.notes||""});setCompleteEditor(null );await refresh(true);}
    catch(e){alert(`Task completion failed: ${e?.message||e}`);}finally{setBusyId("");}
  };
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
      <div><h2 style={{fontFamily:FONT_DISPLAY,fontSize:20,margin:0,color:T.ink}}>WIH Sheet</h2><div style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim,marginTop:4}}>Assigned area tasks and workflow subtasks appear here. Starting a parent task opens its subtasks; the next subtask unlocks after completion. <span style={{fontFamily:FONT_MONO,fontSize:10,color:syncingRemote?T.orange:T.green}}>{syncingRemote?"• Syncing Google Sheets…":"• Synced"}</span></div></div>
    </div>
    <div style={{background:"#fff",border:`1px solid ${T.line}`,borderRadius:8,padding:"12px 14px",marginBottom:14}}>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:10}}>
        <span style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim,marginRight:4}}>TASK SECTION</span>
        {["Pending","Completed","Unallotted","All"].map(x=><Chip key={x} active={taskSection===x} onClick={()=>setTaskSection(x)}>{x} ({sectionCounts[x]})</Chip>)}
        {canAssign&&<button onClick={openBulkAssign} disabled={!bulkProjects.length} style={{...smallBtn,background:T.navy,color:"#fff",padding:"9px 13px",marginLeft:"auto"}}>PROJECT-WISE ASSIGNMENT</button>}
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim,marginRight:4}}>EMPLOYEE</span>
        {canAssign&&<><Chip active={person==="All"} onClick={()=>setPerson("All")}>All Employees</Chip>{people.map(p=><Chip key={p} active={person===p} onClick={()=>setPerson(p)}>{p}</Chip>)}</>}
        {!canAssign&&<span>{state.currentUser?.name} · Own tasks only</span>}
      </div>
    </div>
    {loadingRemote&&remoteTasks.length===0&&<div style={{fontFamily:FONT_BODY,color:T.inkDim,padding:"10px 0"}}>Loading WIH tasks for the first time…</div>}
    {!loadingRemote&&tasks.length===0&&<div style={{color:T.inkDim,fontFamily:FONT_BODY,fontSize:13,padding:"20px 0"}}>No WIH tasks yet. Received drawings create tasks automatically.</div>}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>{tasks.map(t=><div key={t.id} style={{background:"#fff",border:`1px solid ${T.line}`,borderRadius:8,padding:"12px 14px",display:"grid",gridTemplateColumns:"1.5fr 1fr 150px 90px 230px",gap:10,alignItems:"center"}}>
      <div><div style={{fontFamily:FONT_BODY,fontSize:13,fontWeight:700}}>{t.title}</div>{t.milestone&&<div style={{fontFamily:FONT_BODY,fontSize:11,color:T.blue,marginTop:3}}>{t.milestone} → {t.parentTask}</div>}{t.drawingReviewRequired&&<div style={{fontSize:11,color:T.orange,marginTop:3}}>Additional / revised drawing received — review scope</div>}{isBlocked(t.status)&&<div style={{fontSize:11,color:T.inkDim,marginTop:3}}>Waiting for preceding subtask</div>}<div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim,marginTop:3}}>{t.projectName} · {t.floor||"—"} · {t.area||"—"} · {t.drawingType||"—"}</div>{t.designNo&&<div style={{fontFamily:FONT_MONO,fontSize:11,color:T.blue,fontWeight:800,marginTop:3}}>{t.designNo}</div>}</div>
      {assignProject(t.projectId)?<select disabled={!t.designTaskId||busyId===t.designTaskId||isDone(t.status)} value={t.assignee||""} onChange={e=>assign(t,e.target.value)} style={{...inputStyle,padding:"7px 8px",fontSize:12}}><option value="">Assign team member</option>{people.map(n=><option key={n}>{n}</option>)}</select>:<span style={{fontSize:12}}>{t.assignee}</span>}
      <StatusPill status={isDone(t.status)?"Done":isBlocked(t.status)?"Blocked":isProgress(t.status)?"In progress":"To do"}/>
      <div style={{fontFamily:FONT_MONO,fontSize:12}}>{Number(t.hours||0).toFixed(2)} h</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{(canWork&&(assignProject(t.projectId)||t.assigneeUserId===state.currentUser?.userId))&&t.optional&&!isDone(t.status)&&!isBlocked(t.status)&&<button disabled={busyId===t.designTaskId} onClick={()=>action(t,"skip")} style={smallBtn}>SKIP OPTIONAL STEP</button>}{(canWork&&(assignProject(t.projectId)||t.assigneeUserId===state.currentUser?.userId))&&t.drawingReviewRequired&&<button disabled={busyId===t.designTaskId} onClick={()=>action(t,"review")} style={smallBtn}>MARK DRAWING REVIEWED</button>}{(canWork&&(assignProject(t.projectId)||t.assigneeUserId===state.currentUser?.userId))&&!isDone(t.status)&&!isProgress(t.status)&&!isPaused(t.status)&&<button disabled={!t.assignee||busyId===t.designTaskId||isBlocked(t.status)} onClick={()=>action(t,"start")} style={smallBtn}>START</button>}{(canWork&&(assignProject(t.projectId)||t.assigneeUserId===state.currentUser?.userId))&&isProgress(t.status)&&<button disabled={busyId===t.designTaskId} onClick={()=>action(t,"pause")} style={smallBtn}>PAUSE</button>}{(canWork&&(assignProject(t.projectId)||t.assigneeUserId===state.currentUser?.userId))&&isPaused(t.status)&&<button disabled={busyId===t.designTaskId} onClick={()=>action(t,"resume")} style={smallBtn}>RESUME</button>}{(canWork&&(assignProject(t.projectId)||t.assigneeUserId===state.currentUser?.userId))&&!isDone(t.status)&&<button disabled={!t.assignee||busyId===t.designTaskId||isBlocked(t.status)} onClick={()=>setCompleteEditor({task:t,file:null,actualHours:t.hours||"",notes:""})} style={{...smallBtn,background:T.navy,color:"#fff"}}>COMPLETE / UPLOAD</button>}</div>
    </div>)}</div>
    {bulkAssignOpen&&<div style={{position:"fixed",inset:0,zIndex:13900,background:"rgba(8,25,45,.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{width:"min(760px,96vw)",maxHeight:"88vh",overflow:"auto",background:T.paper,border:`1px solid ${T.line}`}}><div style={{background:T.navy,color:"#fff",padding:15,fontFamily:FONT_DISPLAY,fontSize:19}}>Project-wise Task Assignment</div><div style={{padding:16}}><div style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim,marginBottom:14}}>Select one project, then assign each task type once. The selected team member will be applied to every open task of that type in this project.</div><Field label="PROJECT"><select value={bulkProjectId} onChange={e=>{setBulkProjectId(e.target.value);setBulkAssignments({});}} style={inputStyle}>{bulkProjects.map(p=><option key={p.id} value={p.id}>{p.no||p.projectNo||"—"} — {p.name}</option>)}</select></Field>{bulkTaskGroups.length===0?<div style={{fontFamily:FONT_BODY,color:T.inkDim,padding:"14px 0"}}>No open WIH tasks for this project.</div>:<div style={{border:`1px solid ${T.line}`}}>{bulkTaskGroups.map(g=><div key={g.title} style={{display:"grid",gridTemplateColumns:"1.4fr 90px 1fr",gap:10,alignItems:"center",padding:"11px 12px",borderBottom:`1px solid ${T.line}`,background:"#fff"}}><div><div style={{fontFamily:FONT_BODY,fontWeight:700,fontSize:13}}>{g.title}</div><div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim}}>{g.tasks.length} open task{g.tasks.length===1?"":"s"}</div></div><div style={{fontFamily:FONT_MONO,fontSize:11,color:T.inkDim}}>{[...new Set(g.tasks.map(t=>t.floor).filter(Boolean))].join(", ")||"—"}</div><select value={bulkAssignments[g.title]||""} onChange={e=>setBulkAssignments(x=>({...x,[g.title]:e.target.value}))} style={{...inputStyle,padding:"7px 8px",fontSize:12}}><option value="">Keep current / unassigned</option>{people.map(n=><option key={n}>{n}</option>)}</select></div>)}</div>}<div style={{marginTop:12,fontFamily:FONT_MONO,fontSize:11,color:T.inkDim}}>{bulkProjectTasks.length} total open task{bulkProjectTasks.length===1?"":"s"} in selected project.</div></div><div style={{padding:14,borderTop:`1px solid ${T.line}`,display:"flex",justifyContent:"flex-end",gap:8}}><button disabled={bulkSaving} onClick={()=>setBulkAssignOpen(false)} style={{...smallBtn,background:"#fff"}}>Cancel</button><button disabled={bulkSaving||!bulkTaskGroups.length} onClick={saveBulkAssignments} style={{...smallBtn,background:T.navy,color:"#fff",padding:"9px 14px"}}>{bulkSaving?"SAVING…":"SAVE PROJECT ASSIGNMENTS"}</button></div></div></div>}
    {completeEditor&&<div style={{position:"fixed",inset:0,zIndex:14000,background:"rgba(8,25,45,.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{width:"min(650px,96vw)",background:T.paper,border:`1px solid ${T.line}`}}><div style={{background:T.navy,color:"#fff",padding:14,fontFamily:FONT_DISPLAY,fontSize:18}}>Complete WIH Task · {completeEditor.task.designNo||completeEditor.task.title}</div><div style={{padding:16}}><Field label={completeEditor.task.completionUploadRequired===false?"Output / meeting record (optional)":"Completed drawing / output file *"}><input type="file" style={{...inputStyle,padding:8}} onChange={e=>setCompleteEditor(x=>({...x,file:e.target.files?.[0]||null}))}/></Field><Field label="Actual time taken (hours) *"><input type="number" min="0.01" step="0.25" value={completeEditor.actualHours} onChange={e=>setCompleteEditor(x=>({...x,actualHours:e.target.value}))} style={inputStyle}/></Field><Field label={completeEditor.task.taskCategory==='Meeting'?"Meeting minutes / outcome *":"Completion remarks"}><textarea value={completeEditor.notes} onChange={e=>setCompleteEditor(x=>({...x,notes:e.target.value}))} style={{...inputStyle,minHeight:70}}/></Field></div><div style={{padding:14,borderTop:`1px solid ${T.line}`,display:"flex",justifyContent:"flex-end",gap:8}}><button onClick={()=>setCompleteEditor(null)} style={{...smallBtn,background:"#fff"}}>Cancel</button><button onClick={finish} style={{...smallBtn,background:T.navy,color:"#fff"}}>Upload & Complete Task</button></div></div></div>}
  </div>;
}

/* ---------------------------------------------------------------
   VIEW: DASHBOARD — the Floor | Zone matrix from the sheet:
   projects across the top, zone letters down the side, each cell
   showing that zone's floor + room, colored by live task status.
--------------------------------------------------------------- */
// Excel-style zone ordering: A ... Z, AA ... AZ, BA ... ZZ, AAA ...
const zoneOrdinal = code => {
  const value=String(code||'').trim().toUpperCase();
  if(!/^[A-Z]+$/.test(value))return Number.POSITIVE_INFINITY;
  return [...value].reduce((n,ch)=>n*26+ch.charCodeAt(0)-64,0);
};
const compareZoneCodes=(a,b)=>zoneOrdinal(a)-zoneOrdinal(b)||String(a).localeCompare(String(b),undefined,{numeric:true});
function DashboardView({ state, persist }) {
  const [projectId,setProjectId]=useState("");
  const [projectGroup,setProjectGroup]=useState("ongoing");
  const [editor,setEditor]=useState(null);
  const [bulkEditor,setBulkEditor]=useState(null);
  const [areaSaving,setAreaSaving]=useState(false);
  const [bulkSaving,setBulkSaving]=useState(false);
  const [deletingProjects,setDeletingProjects]=useState({});
  const [deleteMessage,setDeleteMessage]=useState("");
  const deleteQueueRef=useRef(new Map()),persistRef=useRef(persist);persistRef.current=persist;
  const projectRows=p=>p.floorZones||Object.entries(p.zones||{}).map(([zoneCode,v],i)=>({floorZoneId:"",zoneCode,floor:v?.floor||"",area:v?.room||"",seq:i+1}));
  const rowKey=r=>r.floorZoneId?`id:${r.floorZoneId}`:`zone:${r.zoneCode}`;
  const setRows=(p,list)=>({...p,floorZones:list,zones:Object.fromEntries(list.map(r=>[r.zoneCode,{floor:r.floor,room:r.area||r.room}]))});
  const drainDeletes=async(id,entry)=>{
    if(entry.running)return;entry.running=true;
    while(entry.pending.length){
      const batch=entry.pending.splice(0),removed=batch.flat();
      try{await projectApi.deleteFloorZones(id,removed.map(r=>({floorZoneId:r.floorZoneId||"",zoneCode:r.zoneCode,floor:r.floor})));}
      catch(err){
        try{await persistRef.current(latest=>({...latest,projects:latest.projects.map(p=>{
          if(p.id!==id)return p;const current=projectRows(p),keys=new Set(current.map(rowKey));
          const restored=[...current,...removed.filter(r=>!keys.has(rowKey(r)))].sort((a,b)=>(Number(a.seq)||0)-(Number(b.seq)||0)||compareZoneCodes(a.zoneCode,b.zoneCode));
          return setRows(p,restored);
        })}));}catch(_){}
        entry.failed=true;entry.errorMessage=`Could not delete areas in ${entry.name}: ${err.message||err}. The affected rows were restored. Please retry.`;setDeleteMessage(entry.errorMessage);
      }
    }
    deleteQueueRef.current.delete(id);setDeletingProjects(current=>{const next={...current};delete next[id];return next;});
    setDeleteMessage(entry.failed?entry.errorMessage:`Zone deletions saved for ${entry.name}.`);
  };
  const removeRows=async(targets)=>{
    if(!project||areaSaving||bulkSaving||!targets.length)return;
    const id=project.id,keys=new Set(targets.map(rowKey));let removed=[];
    try{
      await persistRef.current(latest=>({...latest,projects:latest.projects.map(p=>{
        if(p.id!==id)return p;const current=projectRows(p);removed=current.filter(r=>keys.has(rowKey(r)));
        return removed.length?setRows(p,current.filter(r=>!keys.has(rowKey(r)))):p;
      })}));
    }catch(err){setDeleteMessage(`Could not update areas: ${err.message||err}`);return;}
    if(!removed.length)return;
    let entry=deleteQueueRef.current.get(id);if(!entry){entry={pending:[],running:false,name:project.name||project.no||id,failed:false};deleteQueueRef.current.set(id,entry);}
    entry.pending.push(removed);setDeletingProjects(current=>({...current,[id]:true}));setDeleteMessage("Areas removed · Saving deletions in the background…");
    return drainDeletes(id,entry);
  };
  const completed=p=>[p.status,p.projectStatus,p.projectControl?.projectStatus].some(v=>String(v||"").toLowerCase()==="completed")||p.completed===true||String(p.completed).toLowerCase()==="true"||Boolean(p.completedAt)||Boolean(p.completedDate);
  const allProjects=state.projects||[];
  const ongoingProjects=allProjects.filter(p=>!completed(p)),completedProjects=allProjects.filter(completed);
  const projects=projectGroup==="completed"?completedProjects:ongoingProjects;
  const switchGroup=group=>{if(areaSaving||bulkSaving)return;setProjectGroup(group);setProjectId("");setEditor(null);setBulkEditor(null);};
  const project=projects.find(p=>String(p.id)===String(projectId))||null;

  const rows=project?(project.floorZones||Object.entries(project.zones||{}).map(([zoneCode,v],i)=>({floorZoneId:"",zoneCode,floor:v?.floor||"",area:v?.room||"",seq:i+1}))):[];

  const scopeFloors=project?[...new Set([...designDashboardScopeFloors(project),...rows.map(r=>String(r.floor||"")).filter(Boolean)])]:[];

  const projectDeleting=!!deletingProjects[project?.id];
  const addRow=f=>{if(deleteQueueRef.current.has(project?.id))return;setEditor({mode:"add",floorZoneId:"",zoneCode:"",floor:f||scopeFloors[0]||"",area:""});};
  const editRow=r=>{if(deleteQueueRef.current.has(project?.id))return;setEditor({mode:"edit",floorZoneId:r.floorZoneId||"",zoneCode:r.zoneCode||"",floor:r.floor||"",area:r.area||r.room||""});};
  const save=async()=>{
    if(areaSaving||bulkSaving||deleteQueueRef.current.has(project?.id))return;
    if(!project||!editor?.floor||!editor?.area?.trim())return alert("Select a floor and enter Area / Room.");
    let zoneCode=String(editor.zoneCode||"").trim().toUpperCase();
    if(!/^[A-Z]+$/.test(zoneCode))return alert("Enter a valid Zone Code using letters A–Z (for example A, Z, AA, AB, AZ, BA).");
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
    setAreaSaving(true);
    try{
      const saved=await projectApi.saveFloorZones(project.id,next);
      const finalRows=(saved||next);
      const zones={}; finalRows.forEach(r=>{zones[r.zoneCode]={floor:r.floor,room:r.area};});
      const updated={...project,floorZones:finalRows,zones};
      await persist({...state,projects:(state.projects||[]).map(p=>p.id===project.id?updated:p)});
      setEditor(null);
    }catch(e){alert(`Floor / Zone save failed: ${e?.message||e}`);}
    finally{setAreaSaving(false);}
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
      return {lineIndex:item.lineIndex,zoneCode,floor,area,valid:usedFloors.has(floor)&&/^[A-Z]+$/.test(zoneCode)&&!!area};
    });
  };

  const saveBulk=async()=>{
    if(bulkSaving||areaSaving||deleteQueueRef.current.has(project?.id))return;
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
    setBulkSaving(true);
    try{
      const saved=await projectApi.saveFloorZones(project.id,next);
      const finalRows=(saved||next);
      const zones={}; finalRows.forEach(r=>{zones[r.zoneCode]={floor:r.floor,room:r.area};});
      const updated={...project,floorZones:finalRows,zones};
      await persist({...state,projects:(state.projects||[]).map(p=>p.id===project.id?updated:p)});
      setBulkEditor(null);
    }catch(e){alert(`Bulk Floor / Zone save failed: ${e?.message||e}`);}
    finally{setBulkSaving(false);}
  };
  const remove=r=>removeRows([r]);
  const removeFloor=f=>{
    const targets=rows.filter(r=>String(r.floor)===String(f));
    if(!targets.length)return;
    if(window.confirm(`Delete all ${targets.length} areas on ${f} in ${project.name||project.no}? This removes the floor's zone list.`))return removeRows(targets);
  };

  return <div>
    {(deleteMessage||Object.keys(deletingProjects).length>0)&&<p role="status" style={{fontFamily:FONT_BODY,fontSize:13,color:T.inkDim}}>{Object.keys(deletingProjects).length?"Saving zone deletions in the background…":deleteMessage}</p>}
    <h2 style={{fontFamily:FONT_DISPLAY,fontSize:22,margin:"4px 0"}}>Floor / Zone</h2>
    <div style={{fontFamily:FONT_BODY,fontSize:13,color:T.inkDim,marginBottom:16}}>Projects come from Project → Projects & Scope. Only floors selected in that project's scope are available here. Saved areas automatically flow into Design Dashboard.</div>
    <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginBottom:14}} role="group" aria-label="Floor / Zone project status">
      {[["ongoing","Ongoing Projects",ongoingProjects.length],["completed","Completed Projects",completedProjects.length]].map(([id,label,count])=><button key={id} type="button" aria-pressed={projectGroup===id} disabled={areaSaving||bulkSaving} onClick={()=>switchGroup(id)} style={{...smallBtn,fontFamily:FONT_BODY,fontSize:13,padding:"10px 14px",background:projectGroup===id?T.navy:"#fff",color:projectGroup===id?"#fff":T.ink}}>{`${label} (${count})`}</button>)}
    </div>
    {projectGroup==="completed"&&<div role="status" style={{padding:"10px 12px",marginBottom:14,background:T.paperDim,border:`1px solid ${T.line}`,fontFamily:FONT_BODY,fontSize:13}}>Completed project records: select a project to add or update its floors and areas. Saving here keeps the project completed.</div>}
    <label style={{display:"grid",gap:6,fontFamily:FONT_BODY,fontSize:12,maxWidth:560,marginBottom:16}}>Find and open a project<select aria-label="Floor / Zone project" value={project?.id||""} disabled={areaSaving||bulkSaving} onChange={e=>{setProjectId(e.target.value);setEditor(null);setBulkEditor(null);}} style={inputStyle}><option value="">Select {projectGroup==="completed"?"a completed":"an ongoing"} project…</option>{projects.map(p=><option key={p.id} value={p.id}>{p.no||p.projectNo||""} · {p.name||p.id}</option>)}</select></label>
    <div style={{fontFamily:FONT_MONO,fontSize:10,fontWeight:700,color:T.inkDim,marginBottom:8}}>FLOOR / ZONE MATRIX · SELECT A PROJECT COLUMN TO EDIT ITS AREAS BELOW</div>
    <div style={{border:`1px solid ${T.line}`,background:"transparent",marginBottom:18,overflow:"auto",maxHeight:"68vh"}}>
      {(()=>{
        const floorOrder=["-1F","SF","GF","1F","2F","3F","4F","Terrace","Facade","Landscape"];
        const allFloors=[...new Set([...floorOrder,...projects.flatMap(p=>designDashboardScopeFloors(p))])];
        const zoneCodes=[...new Set(projects.flatMap(p=>(p.floorZones||Object.entries(p.zones||{}).map(([zoneCode,v])=>({zoneCode,...v}))).map(r=>String(r.zoneCode||"").trim().toUpperCase()).filter(Boolean)))].sort(compareZoneCodes);
        const cell={padding:"7px 8px",borderRight:`1px solid ${T.line}`,borderBottom:`1px solid ${T.line}`,fontFamily:FONT_MONO,fontSize:11,whiteSpace:"nowrap",textAlign:"left"};
        return <table style={{borderCollapse:"separate",borderSpacing:0,width:"max-content",minWidth:"100%"}}>
          <thead><tr><th style={{...cell,position:"sticky",left:0,top:0,zIndex:4,minWidth:90,background:"#D2CDC1",borderBottom:`2px solid ${T.ink}`}}>Zone</th>{projects.map(p=><th key={p.id} style={{...cell,position:"sticky",top:0,zIndex:3,minWidth:235,maxWidth:300,background:String(p.id)===String(projectId)?"#c9dce4":"#D2CDC1",borderBottom:`2px solid ${T.ink}`}}><button type="button" onClick={()=>setProjectId(String(p.id))} title="Select this project to manage its areas" style={{border:0,background:"transparent",font:"inherit",fontWeight:800,cursor:"pointer",textAlign:"left",color:T.ink,whiteSpace:"normal"}}>{p.name||p.no||p.projectNo}</button><div style={{fontSize:9,fontWeight:400,marginTop:3}}>{p.no||p.projectNo}</div></th>)}</tr></thead>
          <tbody>
            {allFloors.map((f,i)=><tr key={'floor-'+f}><th style={{...cell,position:"sticky",left:0,zIndex:2,background:"#fff",fontWeight:800}}>{f}</th>{projects.map(p=>{const scope=designDashboardScopeFloors(p);return <td key={p.id} style={{...cell,background:"transparent"}}>{scope.includes(f)?f:""}</td>})}</tr>)}
            {zoneCodes.map((z,i)=><tr key={'zone-'+z}><th style={{...cell,position:"sticky",left:0,zIndex:2,background:"#fff",fontWeight:800}}>{z}</th>{projects.map(p=>{const r=(p.floorZones||Object.entries(p.zones||{}).map(([zoneCode,v])=>({zoneCode,floor:v?.floor,area:v?.room}))).find(x=>String(x.zoneCode||"").trim().toUpperCase()===z);return <td key={p.id} style={{...cell,background:"transparent"}}>{r?[r.floor,r.area||r.room].filter(Boolean).join(" | "):""}</td>})}</tr>)}
            {!projects.length&&<tr><td style={{...cell,padding:16}}>No {projectGroup=== "completed"?"completed":"ongoing"} projects found.</td></tr>}
          </tbody>
        </table>;
      })()}
    </div>

    {project&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div><div style={{fontFamily:FONT_MONO,fontSize:10,color:T.cyan}}>SELECTED PROJECT · {project.no||project.projectNo}</div><h3 style={{fontFamily:FONT_DISPLAY,fontSize:20,margin:"3px 0"}}>{project.name}</h3><span style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim}}>Status: {completed(project)?"Completed":project.status||"Ongoing"}</span></div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}><button type="button" disabled={!scopeFloors.length||projectDeleting||areaSaving||bulkSaving} onClick={()=>setBulkEditor({floor:scopeFloors[0]||"",text:""})} style={{...smallBtn,background:T.navy,color:"#fff",padding:"9px 14px"}}>+ BULK ADD AREAS</button><button type="button" disabled={!scopeFloors.length||projectDeleting||areaSaving||bulkSaving} onClick={()=>addRow(scopeFloors[0])} style={{...smallBtn,background:"#fff",padding:"9px 14px"}}>+ ADD ONE</button></div>
      </div>
      {scopeFloors.map(f=>{const fr=rows.filter(r=>String(r.floor)===f);return <div key={f} style={{border:`1px solid ${T.line}`,background:"#fff",marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",padding:"10px 12px",background:T.paper2,borderBottom:`1px solid ${T.line}`}}><strong>{f} · {fr.length} areas</strong><div style={{display:"flex",gap:8}}>{fr.length>0&&<button type="button" disabled={areaSaving||bulkSaving} aria-label={`Delete all areas on ${f}`} onClick={()=>removeFloor(f)} style={{...smallBtn,background:"#fff",color:T.redline}}>DELETE FLOOR AREAS</button>}<button type="button" disabled={projectDeleting||areaSaving||bulkSaving} onClick={()=>addRow(f)} style={{...smallBtn,background:"#fff"}}>+ AREA</button></div></div>
        <div style={{display:"grid",gridTemplateColumns:"100px 1fr 180px",fontSize:11,fontWeight:700,borderBottom:`1px solid ${T.line}`}}><div style={{padding:8}}>Zone</div><div style={{padding:8}}>Area / Room</div><div style={{padding:8}}>Action</div></div>
        {fr.map((r,i)=><div key={r.floorZoneId||r.zoneCode||i} style={{display:"grid",gridTemplateColumns:"100px 1fr 180px",fontSize:12,borderBottom:i<fr.length-1?`1px solid ${T.line}`:"none"}}><div style={{padding:8,fontFamily:FONT_MONO}}>{r.zoneCode||"—"}</div><div style={{padding:8,fontWeight:600}}>{r.area||r.room}</div><div style={{padding:6,display:"flex",gap:6}}><button type="button" disabled={projectDeleting||areaSaving||bulkSaving} onClick={()=>editRow(r)} style={{...smallBtn,background:"#fff"}}>EDIT</button><button type="button" disabled={areaSaving||bulkSaving} onClick={()=>remove(r)} style={{...smallBtn,background:"#fff"}}>DELETE</button></div></div>)}
        {!fr.length&&<div style={{padding:10,fontSize:11,color:T.inkDim}}>No areas entered for {f}.</div>}
      </div>})}
    </div>}

    {editor&&project&&<div style={{position:"fixed",inset:0,zIndex:13000,background:"rgba(8,25,45,.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"min(650px,96vw)",background:T.paper,border:`1px solid ${T.line}`}}>
        <div style={{background:T.navy,color:"#fff",padding:14,fontFamily:FONT_DISPLAY,fontSize:18}}>{editor.mode==="edit"?"Edit":"Add"} Floor / Zone · {project.no}</div>
        <div style={{padding:16,display:"grid",gridTemplateColumns:"160px 1fr",gap:12}}>
          <Field label="Zone Code"><input value={editor.zoneCode} onChange={e=>setEditor(x=>({...x,zoneCode:e.target.value.toUpperCase()}))} placeholder="Zone Code (A, Z, AA, AB, BA…)" style={inputStyle}/></Field>
          <Field label="Floor from Project Scope"><select value={editor.floor} onChange={e=>setEditor(x=>({...x,floor:e.target.value}))} style={inputStyle}>{scopeFloors.map(f=><option key={f}>{f}</option>)}</select></Field>
          <div style={{gridColumn:"1 / -1"}}><Field label="Area / Room"><input value={editor.area} onChange={e=>setEditor(x=>({...x,area:e.target.value}))} placeholder="Living Room, Bedroom, Washroom..." style={inputStyle}/></Field></div>
        </div>
        <div style={{padding:14,borderTop:`1px solid ${T.line}`,display:"flex",justifyContent:"flex-end",gap:8}}><button type="button" onClick={()=>setEditor(null)} style={{...smallBtn,background:"#fff"}}>Cancel</button><button type="button" onClick={save} disabled={areaSaving} style={{...smallBtn,background:T.navy,color:"#fff"}}>{areaSaving?"Saving area…":"Save Floor / Zone"}</button></div>
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
          <button type="button" disabled={bulkSaving} onClick={()=>setBulkEditor(null)} style={{...smallBtn,background:"#fff"}}>Cancel</button>
          <button type="button" disabled={bulkSaving} onClick={saveBulk} style={{...smallBtn,background:T.navy,color:"#fff",opacity:bulkSaving?.65:1,cursor:bulkSaving?"wait":"pointer"}}>{bulkSaving?"Saving areas…":"Save All Areas"}</button>
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
function ContactFields({contacts,onChange}) {
  return <ProjectTeamContactFields contacts={contacts} onChange={onChange}/>;
}

// Display project calendar dates without the timestamp or timezone shifts.
function formatProjectDate(value) {
  if(!value)return "—";
  const raw=String(value).trim();
  const iso=raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/);
  if(iso)return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const dmy=raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})(?:$|\s)/);
  if(dmy)return `${dmy[1].padStart(2,'0')}/${dmy[2].padStart(2,'0')}/${dmy[3]}`;
  const date=new Date(raw);
  return Number.isNaN(date.getTime())?"—":new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Asia/Kolkata'}).format(date);
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

const PROJECT_CREATE_JOBS=new Map();
function runProjectCreateJob(persist,job){
  if(PROJECT_CREATE_JOBS.has(job.id))return PROJECT_CREATE_JOBS.get(job.id);
  const work=(async()=>{
    try{
      await persist(latest=>({...latest,pendingProjectCreates:(latest.pendingProjectCreates||[]).map(j=>j.id===job.id?{...j,status:'saving',error:''}:j)}));
      const project=job.project,contacts=contactsObjectToRows(project,project.contacts);
      const row=await projectApi.create({...frontendProjectToBackend(project,true),initialContacts:contacts});
      // Compatible with an older backend while deployments roll out.
      if(row.initialContactsSaved!==true&&contacts.length)await projectApi.saveContacts(row.projectId||project.id,contacts.map(c=>({...c,projectId:row.projectId||project.id})));
      const created=backendProjectToFrontend(row,project);
      await persist(latest=>({...latest,projects:latest.projects.some(p=>p.id===created.id)?latest.projects.map(p=>p.id===created.id?{...p,...created}:p):[...latest.projects,created],pendingProjectCreates:(latest.pendingProjectCreates||[]).filter(j=>j.id!==job.id)}));
      return created;
    }catch(err){
      await persist(latest=>({...latest,pendingProjectCreates:(latest.pendingProjectCreates||[]).map(j=>j.id===job.id?{...j,status:'error',error:err.message||String(err)}:j)}));
      return null;
    }finally{PROJECT_CREATE_JOBS.delete(job.id);}
  })();
  PROJECT_CREATE_JOBS.set(job.id,work);return work;
}

function PendingProjectCreations({state,persist}){
  const jobs=state.pendingProjectCreates||[];if(!jobs.length)return null;
  return <div style={{margin:'12px 0',display:'grid',gap:8}}>{jobs.map(job=>{
    const saving=job.status==='saving'&&PROJECT_CREATE_JOBS.has(job.id);
    return <div key={job.id} role="status" style={{border:`1px solid ${T.line}`,background:T.paperDim,padding:'12px 14px',fontFamily:FONT_BODY,fontSize:13,display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}><div><strong>{job.project.no} · {job.project.name}</strong><div style={{color:job.error?T.redline:T.inkDim,marginTop:4}}>{saving?'Saving new project in the background…':job.error||'Creation was interrupted. Retry to finish saving; your details are retained.'}</div></div>{!saving&&<button type="button" style={smallBtn} onClick={()=>runProjectCreateJob(persist,job)}>Retry</button>}</div>;
  })}</div>;
}

function ProjectOnboarding({ state, persist, selectedId, setSelectedId, initialMode = "browse" }) {
  const [mode, setMode] = useState(initialMode);
  const [draft, setDraft] = useState(emptyDraft());
  const [saved, setSaved] = useState(false);
  const [creating, setCreating] = useState(false);
  const creatingRef=useRef(false);

  const saveNew = async () => {
    if (!draft.name.trim() || creatingRef.current) return;
    const duplicate=[...(state.projects||[]),...(state.pendingProjectCreates||[]).map(j=>j.project)].some(p=>String(p.no||'').trim().toLowerCase()===draft.no.trim().toLowerCase()&&String(p.name||'').trim().toLowerCase()===draft.name.trim().toLowerCase());
    if(duplicate){alert('This project already exists or is being saved.');return;}
    creatingRef.current=true;setCreating(true);
    const cleanContacts = {};
    Object.entries(draft.contacts).forEach(([role, c]) => {
      if (c && (String(c.name||"").trim()||String(c.company||"").trim())) cleanContacts[role] = { name:String(c.name||"").trim(), company:String(c.company||"").trim(), email:String(c.email||"").trim(), mobile:String(c.mobile||"").trim() };
    });
    const ownerName = (cleanContacts.Owner?.name || "").trim();
    const architectName = (cleanContacts.Architect?.name || "").trim();

    const project = {
      id: 'PRJ-'+(globalThis.crypto?.randomUUID?.()||uid()+uid()),
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
    const job={id:project.id,ownerEmail:state.currentUser?.email||'',project,status:'saving',error:''};
    const localSave=persist(latest=>({...latest,pendingProjectCreates:[...(latest.pendingProjectCreates||[]),job]}));
    setDraft(emptyDraft());setMode('browse');setSaved(false);setCreating(false);
    setSelectedId(selectedId||state.projects?.[0]?.id||null);
    try{await localSave;return await runProjectCreateJob(persist,job);}
    catch(err){alert(`Could not queue this project: ${err.message||err}`);}
    finally{creatingRef.current=false;}
  };

  const updateProject = async (projectId, patch) => {
    const current = state.projects.find(p => p.id === projectId);
    if (!current) return;
    const nextStatus = patch.projectStatus || current.projectStatus || current.status;
    const nextProject = { ...current, ...patch, status: nextStatus, projectStatus: nextStatus, projectControl: {...current.projectControl, projectStatus: nextStatus, ...(patch.projectStage ? {currentStage:patch.projectStage} : {})}, ...(nextStatus !== "Completed" ? {completed:false,completedAt:"",completedDate:""} : {}) };
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
        <div style={{ display: initialMode === "new" ? "none" : "flex", gap: 8 }}>
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
            <Btn onClick={saveNew} disabled={!draft.name.trim() || creating}><ClipboardCheck size={14} /> {creating ? "Creating project…" : "Create project"}</Btn>
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
    setRow(found ? {...found} : {serial:"",project:project.name,client:"",architect:"",basement:false,stilt_floor:false,gf:false,"1f":false,"2f":false,"3f":false,terrace:false,facade:false,wall_elevation:false,art_curation:false,landscape:false,bath_elevation:false,wardrobe:false,kitchen:false,onboarding:false});
  }, [project?.id, state.scopeSheet]);
  if (!project || !row) return null;
  const boolFields = [["basement","Basement"],["stilt_floor","Stilt Floor"],["gf","GF"],["1f","1F"],["2f","2F"],["3f","3F"],["terrace","Terrace"],["facade","Facade"],["landscape","Landscape"],["bath_elevation","Bath Elevation"],["wardrobe","Furniture"],["art_curation","Art Curation"],["onboarding","Onboarding"]];
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

function ProjectTeamContactFields({contacts, onChange}) {
  return <div style={{display:"flex",flexDirection:"column",gap:18,marginBottom:16}}>
    {ROLE_CATEGORIES.map(({category,roles}) => <div key={category}>
      <div style={{fontFamily:FONT_MONO,fontSize:10,letterSpacing:".08em",textTransform:"uppercase",color:categoryColor(category),marginBottom:8}}>{contactRoleLabel(category)}</div>
      <div style={{borderTop:`2px solid ${T.ink}`}}>{roles.map(role => <div key={role} style={{display:"grid",gridTemplateColumns:"170px repeat(4,minmax(110px,1fr))",gap:8,padding:"10px 0",borderBottom:`1px solid ${T.line}`,alignItems:"center"}}>
        <div style={{fontFamily:FONT_MONO,fontSize:11.5,color:T.inkDim}}>{contactRoleLabel(role)}</div>
        {[["name","Contact name"],["company","Company / Studio"],["email","Email"],["mobile","Mobile"]].map(([field,label]) => <input key={field} aria-label={`${contactRoleLabel(role)} ${label}`} style={inputStyle} placeholder={label} value={contacts[role]?.[field] || ""} onChange={e=>onChange(role,field,e.target.value)}/>)}
      </div>)}</div>
    </div>)}
  </div>;
}

function ProjectTeamView({ state, persist, selectedId }) {
  const project = (state.projects || []).find(p => String(p.id) === String(selectedId)) || (state.projects || [])[0];
  const [editing, setEditing] = useState(false);
  const [directoryMode, setDirectoryMode] = useState(false);
  const [roleFilter, setRoleFilter] = useState("All");
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadedContacts, setLoadedContacts] = useState(null);
  const [saveMessage,setSaveMessage]=useState("");
  const latestRef=useRef(state);latestRef.current=state;
  const selectedRef=useRef(project?.id);selectedRef.current=project?.id;
  const savePendingRef=useRef(false);
  const workflowProjectRef=useRef(project?.id);workflowProjectRef.current=project?.id;
  const contactsRevisionRef=useRef(0);
  useEffect(() => {
    let active = true;
    setEditing(false);
    setLoadedContacts(null);
    setSaveMessage("");
    const revision=++contactsRevisionRef.current;
    if (project) projectApi.listContacts(project.id).then(rows => {
      const contacts = contactRowsToObject(rows || []);
      if (active && revision===contactsRevisionRef.current && Object.keys(contacts).length) setLoadedContacts(contacts);
    }).catch(err => console.warn("ProjectContacts background load failed", err));
    return () => { active = false; };
  }, [project?.id]);
  if (!project) return <div style={{color:T.inkDim}}>No project available.</div>;
  const contacts = Object.fromEntries(Object.entries(loadedContacts || project.contacts || {}).filter(([,c]) => c && (String(c.name ?? "").trim()||String(c.company ?? "").trim())).map(([role,c]) => [role, {...c,
    name:String(c.name ?? ""), email:String(c.email ?? ""), mobile:String(c.mobile ?? ""), company:String(c.company ?? "")}]));
  const directoryProjects = (state.projects || []).map(p => p.id === project.id ? {...p, contacts} : p);
  const start = () => {
    if(savePendingRef.current)return;
    ++contactsRevisionRef.current;
    const next = JSON.parse(JSON.stringify(contacts));
    if (!next.Owner?.name && !next.Owner?.company && project.client) next.Owner = {name:String(project.client), email:"", mobile:""};
    if (!next.Architect?.name && !next.Architect?.company && project.architect) next.Architect = {name:String(project.architect), email:"", mobile:""};
    setDraft(next); setDirectoryMode(false); setEditing(true);
  };
  const save = async () => {
    if(savePendingRef.current)return;
    const clean={};
    Object.entries(draft).forEach(([role,c])=>{
      if(c&&(String(c.name??"").trim()||String(c.company??"").trim()))clean[role]={...c,name:String(c.name??"").trim(),company:String(c.company??"").trim(),email:String(c.email??"").trim(),mobile:String(c.mobile??"").trim()};
    });
    const before=project,previousContacts=contacts,draftSnapshot=draft,id=project.id;
    const next={...project,contacts:clean,client:clean.Owner?.name||"",architect:clean.Architect?.name||""};
    const latest=latestRef.current;
    const optimistic={...latest,projects:latest.projects.map(p=>p.id===id?{...p,contacts:clean,client:next.client,architect:next.architect}:p)};
    savePendingRef.current=true;++contactsRevisionRef.current;
    latestRef.current=optimistic;
    const localSave=persist(optimistic);
    setLoadedContacts(clean);setEditing(false);setSaving(true);
    setSaveMessage("Changes applied · Saving to Google Sheets…");
    try {
      await localSave;
      await projectApi.saveContacts(id,contactsObjectToRows(next,clean));
    } catch(err) {
      const latest=latestRef.current;
      const restored={...latest,projects:latest.projects.map(p=>p.id===id?{...p,
        ...(JSON.stringify(p.contacts)===JSON.stringify(clean)?{contacts:before.contacts}:{}),
        ...(p.client===next.client?{client:before.client}:{}),
        ...(p.architect===next.architect?{architect:before.architect}:{})}:p)};
      latestRef.current=restored;await persist(restored);
      if(selectedRef.current===id){setLoadedContacts(previousContacts);setDraft(draftSnapshot);setEditing(true);setSaveMessage(`Save failed. Your draft is retained; please retry. ${err?.message||err}`);}
      savePendingRef.current=false;setSaving(false);return;
    }
    try {
      const current=latestRef.current.projects.find(p=>p.id===id);
      if(current)await projectApi.update(frontendProjectToBackend(current,true));
      if(selectedRef.current===id)setSaveMessage("Saved to Google Sheets.");
    } catch(err) {
      if(selectedRef.current===id)setSaveMessage(`Contacts saved, but the project summary could not sync. Please save again. ${err?.message||err}`);
    } finally {
      savePendingRef.current=false;setSaving(false);
    }
  };
  const directory = buildDirectory(directoryProjects, state.ratings || {});
  const filtered = roleFilter === "All" ? directory : directory.filter(d=>d.roles.includes(roleFilter));
  const roles = Array.from(new Set(directory.flatMap(d=>d.roles))).sort();
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><div><h2 style={{fontFamily:FONT_DISPLAY,fontSize:20,margin:0,color:T.ink}}>Team & Ratings</h2><div style={{fontFamily:FONT_BODY,fontSize:13,color:T.inkDim,marginTop:4}}>Project contacts are shown here by default. Turn on Directory to see the consolidated directory view.</div></div><div style={{display:"flex",gap:8}}>{!editing && <Btn disabled={saving} variant="ghost" onClick={start}>Edit / add contacts</Btn>}<Btn variant="ghost" style={directoryMode ? {borderColor:"transparent"} : undefined} disabled={saving} onClick={()=>{setEditing(false);setDirectoryMode(v=>!v);}}>{directoryMode?"Directory On":"Directory"}</Btn></div></div>
    {saveMessage&&<p role="status" style={{fontFamily:FONT_BODY,fontSize:12}}>{saveMessage}</p>}
    {directoryMode ? <ProjectDirectory state={{...state,projects:directoryProjects}} persist={async next=>{++contactsRevisionRef.current;latestRef.current=next;const current=next.projects.find(p=>p.id===selectedRef.current);if(current)setLoadedContacts(current.contacts||{});await persist(next);}}/> : editing ? <><ProjectTeamContactFields contacts={draft} onChange={(role,field,value)=>setDraft(d=>({...d,[role]:{...(d[role]||{}),[field]:value}}))}/><div style={{display:"flex",gap:8}}><Btn disabled={saving} onClick={save}><ClipboardCheck size={14}/> {saving ? "Saving…" : "Save contacts"}</Btn><Btn disabled={saving} variant="ghost" onClick={()=>setEditing(false)}>Cancel</Btn></div></> : <div style={{display:"flex",flexDirection:"column",gap:16}}>{ROLE_CATEGORIES.map(({category,roles})=>{const entries=roles.filter(r=>contacts?.[r]);if(!entries.length)return null;return <div key={category}><div style={{fontFamily:FONT_MONO,fontSize:10,letterSpacing:".08em",textTransform:"uppercase",color:categoryColor(category),marginBottom:8}}>{contactRoleLabel(category)}</div><div style={{borderTop:`2px solid ${T.ink}`,borderBottom:`1px solid ${T.line}`}}>{entries.map((role,idx)=>{const c=contacts[role];return <div key={role} style={{display:"grid",gridTemplateColumns:"170px repeat(4,minmax(100px,1fr))",padding:"10px 0",borderTop:idx===0?"none":`1px solid ${T.line}`}}><div style={{fontFamily:FONT_MONO,fontSize:11.5,color:T.inkDim}}>{contactRoleLabel(role)}</div><div style={{fontFamily:FONT_BODY,fontSize:13}}>{c.name||"—"}</div><div style={{fontFamily:FONT_BODY,fontSize:13}}>{c.company||"—"}</div><div style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim}}>{c.email||"—"}</div><div style={{fontFamily:FONT_MONO,fontSize:12,color:T.blue}}>{c.mobile||"—"}</div></div>})}</div></div>})}{Object.keys(contacts).length===0&&<div style={{color:T.inkDim}}>No contacts on file.</div>}</div>}
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
  if (all.some(r => String(r.workflowVersion) === "1")) return {design:all.filter(r=>String(r.workflowVersion)==="1"),execution:all.filter(r=>String(r.workflowVersion)!=="1" && r.milestone)};
  const firstMilestone = all.findIndex(r=>String(r.milestone||"").trim());
  if(firstMilestone < 0) return {design:all, execution:[]};
  return {design:all.slice(0,firstMilestone), execution:all.slice(firstMilestone)};
}

const DESIGN_TASK_FLOW_TEMPLATE = [{"id": "DESIGN-01-01", "workflowVersion": "2", "milestone": "Concept | Freeze Products", "tasks": "Concept | Freeze Products", "startingMilestone": "Receive Layout \u00b7 floor & zone wise", "subtask": "Meeting with CL | Architect to understand Theme", "taskCategory": "Meeting", "meetingMode": "In person", "triggerDrawingType": "LAYOUT", "triggerTaskType": "Concept | 2D", "scope": "Stage", "subtaskOrder": 1, "responsible": "", "hours": "", "completionUploadRequired": false, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-01-02", "workflowVersion": "2", "milestone": "Concept | Freeze Products", "tasks": "Concept | Freeze Products", "startingMilestone": "Receive Layout \u00b7 floor & zone wise", "subtask": "Initial Concept", "taskCategory": "Design", "meetingMode": "", "triggerDrawingType": "LAYOUT", "triggerTaskType": "Concept | 2D", "scope": "Stage", "subtaskOrder": 2, "responsible": "", "hours": "", "completionUploadRequired": true, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-01-03", "workflowVersion": "2", "milestone": "Concept | Freeze Products", "tasks": "Concept | Freeze Products", "startingMilestone": "Receive Layout \u00b7 floor & zone wise", "subtask": "Present & Discuss with CL | Architect", "taskCategory": "Meeting", "meetingMode": "In person", "triggerDrawingType": "LAYOUT", "triggerTaskType": "Concept | 2D", "scope": "Stage", "subtaskOrder": 3, "responsible": "", "hours": "", "completionUploadRequired": false, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-01-04", "workflowVersion": "2", "milestone": "Concept | Freeze Products", "tasks": "Concept | Freeze Products", "startingMilestone": "Receive Layout \u00b7 floor & zone wise", "subtask": "Preliminary Budgeting", "taskCategory": "Meeting", "meetingMode": "In person", "triggerDrawingType": "LAYOUT", "triggerTaskType": "Concept | 2D", "scope": "Stage", "subtaskOrder": 4, "responsible": "", "hours": "", "completionUploadRequired": false, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-02-01", "workflowVersion": "2", "milestone": "Control Finalisation", "tasks": "Control Finalisation", "startingMilestone": "Concept approved \u00b7 showcase wired/wireless options and budget", "subtask": "Showcase Wireless | Wired Options with budget", "taskCategory": "Design", "meetingMode": "", "triggerDrawingType": "MANUAL", "triggerTaskType": "Control Finalisation", "scope": "Stage", "subtaskOrder": 1, "responsible": "", "hours": "", "completionUploadRequired": true, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-03-01", "workflowVersion": "2", "milestone": "Wall Electrical", "tasks": "Wall Electrical", "startingMilestone": "Receive WE \u00b7 integrate final keypad and lamp socket locations", "subtask": "Meeting with Controls Vendor | CL | Architect [if req.]", "taskCategory": "Meeting", "meetingMode": "Phone / Zoom allowed", "triggerDrawingType": "WE", "triggerTaskType": "Wall Electrical Drawings", "scope": "Stage", "subtaskOrder": 1, "responsible": "", "hours": "", "completionUploadRequired": false, "optional": true, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-03-02", "workflowVersion": "2", "milestone": "Wall Electrical", "tasks": "Wall Electrical", "startingMilestone": "Receive WE \u00b7 integrate final keypad and lamp socket locations", "subtask": "Lighting User Interface | Draw", "taskCategory": "Design", "meetingMode": "", "triggerDrawingType": "WE", "triggerTaskType": "Wall Electrical Drawings", "scope": "Stage", "subtaskOrder": 2, "responsible": "", "hours": "", "completionUploadRequired": true, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-03-03", "workflowVersion": "2", "milestone": "Wall Electrical", "tasks": "Wall Electrical", "startingMilestone": "Receive WE \u00b7 integrate final keypad and lamp socket locations", "subtask": "Issue & Discuss | Revision [if req.] | Approval Final [Milestone]", "taskCategory": "Meeting", "meetingMode": "Phone / Zoom allowed", "triggerDrawingType": "WE", "triggerTaskType": "Wall Electrical Drawings", "scope": "Stage", "subtaskOrder": 3, "responsible": "", "hours": "", "completionUploadRequired": false, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-04-01", "workflowVersion": "2", "milestone": "False Ceiling Corrections", "tasks": "False Ceiling Corrections", "startingMilestone": "Receive FC \u00b7 floor & zone wise", "subtask": "Typical Section Detail | Draw", "taskCategory": "Design", "meetingMode": "", "triggerDrawingType": "FC", "triggerTaskType": "False Ceiling Drawings", "scope": "Stage", "subtaskOrder": 1, "responsible": "", "hours": "", "completionUploadRequired": true, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-04-02", "workflowVersion": "2", "milestone": "False Ceiling Corrections", "tasks": "False Ceiling Corrections", "startingMilestone": "Receive FC \u00b7 floor & zone wise", "subtask": "Issue & Discuss | Revision [if req.] | Approval Final [Milestone]", "taskCategory": "Meeting", "meetingMode": "Phone / Zoom allowed", "triggerDrawingType": "FC", "triggerTaskType": "False Ceiling Drawings", "scope": "Stage", "subtaskOrder": 2, "responsible": "", "hours": "", "completionUploadRequired": false, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-05-01", "workflowVersion": "2", "milestone": "Night Renders", "tasks": "Night Renders", "startingMilestone": "Receive 3D \u00b7 zone wise", "subtask": "3D Renders", "taskCategory": "Design", "meetingMode": "", "triggerDrawingType": "3D", "triggerTaskType": "3D Renders", "scope": "Stage", "subtaskOrder": 1, "responsible": "", "hours": "", "completionUploadRequired": true, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-05-02", "workflowVersion": "2", "milestone": "Night Renders", "tasks": "Night Renders", "startingMilestone": "Receive 3D \u00b7 zone wise", "subtask": "Final Concept Meeting", "taskCategory": "Meeting", "meetingMode": "In person", "triggerDrawingType": "3D", "triggerTaskType": "3D Renders", "scope": "Stage", "subtaskOrder": 2, "responsible": "", "hours": "", "completionUploadRequired": false, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-06-01", "workflowVersion": "2", "milestone": "Wiring Drawings", "tasks": "Wiring Drawings", "startingMilestone": "Receive FC clubbed with AC/Fan locations and levels \u00b7 lighting layout RCP/FLR/CIR", "subtask": "RCP/FLR/CIR | Draw", "taskCategory": "Design", "meetingMode": "", "triggerDrawingType": "FC", "triggerTaskType": "Lighting Layout / Wiring", "scope": "Stage", "subtaskOrder": 1, "responsible": "", "hours": "", "completionUploadRequired": true, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-06-02", "workflowVersion": "2", "milestone": "Wiring Drawings", "tasks": "Wiring Drawings", "startingMilestone": "Receive FC clubbed with AC/Fan locations and levels \u00b7 lighting layout RCP/FLR/CIR", "subtask": "Issue & Discuss | Revision [if req.] | Approval Final [Milestone]", "taskCategory": "Meeting", "meetingMode": "Phone / Zoom allowed", "triggerDrawingType": "FC", "triggerTaskType": "Lighting Layout / Wiring", "scope": "Stage", "subtaskOrder": 2, "responsible": "", "hours": "", "completionUploadRequired": false, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-07-01", "workflowVersion": "2", "milestone": "Documentation", "tasks": "Documentation", "startingMilestone": "Technical Table \u00b7 floor & zone wise", "subtask": "Documentation- Tech Table", "taskCategory": "Design", "meetingMode": "", "triggerDrawingType": "MANUAL", "triggerTaskType": "Technical Table / Documentation", "scope": "Stage", "subtaskOrder": 1, "responsible": "", "hours": "", "completionUploadRequired": true, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-07-02", "workflowVersion": "2", "milestone": "Documentation", "tasks": "Documentation", "startingMilestone": "Technical Table \u00b7 floor & zone wise", "subtask": "Documentation- Luminaire Schedule", "taskCategory": "Design", "meetingMode": "", "triggerDrawingType": "MANUAL", "triggerTaskType": "Technical Table / Documentation", "scope": "Stage", "subtaskOrder": 2, "responsible": "", "hours": "", "completionUploadRequired": true, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-07-03", "workflowVersion": "2", "milestone": "Documentation", "tasks": "Documentation", "startingMilestone": "Technical Table \u00b7 floor & zone wise", "subtask": "Internal Review", "taskCategory": "Meeting", "meetingMode": "Phone / Zoom allowed", "triggerDrawingType": "MANUAL", "triggerTaskType": "Technical Table / Documentation", "scope": "Stage", "subtaskOrder": 3, "responsible": "", "hours": "", "completionUploadRequired": false, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-07-04", "workflowVersion": "2", "milestone": "Documentation", "tasks": "Documentation", "startingMilestone": "Technical Table \u00b7 floor & zone wise", "subtask": "Arranging samples for CL Review", "taskCategory": "Design", "meetingMode": "", "triggerDrawingType": "MANUAL", "triggerTaskType": "Technical Table / Documentation", "scope": "Stage", "subtaskOrder": 4, "responsible": "", "hours": "", "completionUploadRequired": true, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-07-05", "workflowVersion": "2", "milestone": "Documentation", "tasks": "Documentation", "startingMilestone": "Technical Table \u00b7 floor & zone wise", "subtask": "External Review | Mockup | Discuss BOQ", "taskCategory": "Meeting", "meetingMode": "In person", "triggerDrawingType": "MANUAL", "triggerTaskType": "Technical Table / Documentation", "scope": "Stage", "subtaskOrder": 5, "responsible": "", "hours": "", "completionUploadRequired": false, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-07-06", "workflowVersion": "2", "milestone": "Documentation", "tasks": "Documentation", "startingMilestone": "Technical Table \u00b7 floor & zone wise", "subtask": "Present final BOQ with colour test | Close", "taskCategory": "Design", "meetingMode": "", "triggerDrawingType": "MANUAL", "triggerTaskType": "Technical Table / Documentation", "scope": "Stage", "subtaskOrder": 6, "responsible": "", "hours": "", "completionUploadRequired": true, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-08-01", "workflowVersion": "2", "milestone": "Documentation", "tasks": "Documentation", "startingMilestone": "Execution Bundle | GFCs \u00b7 final consolidated drawing approval", "subtask": "Dialux Modelling", "taskCategory": "Design", "meetingMode": "", "triggerDrawingType": "MANUAL", "triggerTaskType": "Execution Bundle | GFCs", "scope": "Stage", "subtaskOrder": 1, "responsible": "", "hours": "", "completionUploadRequired": true, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-08-02", "workflowVersion": "2", "milestone": "Documentation", "tasks": "Documentation", "startingMilestone": "Execution Bundle | GFCs \u00b7 final consolidated drawing approval", "subtask": "Light Marking Sheet | Arrange All Samples", "taskCategory": "Design", "meetingMode": "", "triggerDrawingType": "MANUAL", "triggerTaskType": "Execution Bundle | GFCs", "scope": "Stage", "subtaskOrder": 2, "responsible": "", "hours": "", "completionUploadRequired": true, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-08-03", "workflowVersion": "2", "milestone": "Documentation", "tasks": "Documentation", "startingMilestone": "Execution Bundle | GFCs \u00b7 final consolidated drawing approval", "subtask": "Site Execution Sheet", "taskCategory": "Design", "meetingMode": "", "triggerDrawingType": "MANUAL", "triggerTaskType": "Execution Bundle | GFCs", "scope": "Stage", "subtaskOrder": 3, "responsible": "", "hours": "", "completionUploadRequired": true, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-09-01", "workflowVersion": "2", "milestone": "Bathroom Stone", "tasks": "Bathroom Stone", "startingMilestone": "Receive Bathroom 3Ds/Elevations \u00b7 bathroom/wall elevation zone wise", "subtask": "3D Renders", "taskCategory": "Design", "meetingMode": "", "triggerDrawingType": "BATHROOM", "triggerTaskType": "Bathroom Elevation Drawings", "scope": "Stage", "subtaskOrder": 1, "responsible": "", "hours": "", "completionUploadRequired": true, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-09-02", "workflowVersion": "2", "milestone": "Bathroom Stone", "tasks": "Bathroom Stone", "startingMilestone": "Receive Bathroom 3Ds/Elevations \u00b7 bathroom/wall elevation zone wise", "subtask": "Present & Discuss with CL | Architect", "taskCategory": "Meeting", "meetingMode": "In person", "triggerDrawingType": "BATHROOM", "triggerTaskType": "Bathroom Elevation Drawings", "scope": "Stage", "subtaskOrder": 2, "responsible": "", "hours": "", "completionUploadRequired": false, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-09-03", "workflowVersion": "2", "milestone": "Bathroom Stone", "tasks": "Bathroom Stone", "startingMilestone": "Receive Bathroom 3Ds/Elevations \u00b7 bathroom/wall elevation zone wise", "subtask": "Typical Section Detail | Draw", "taskCategory": "Design", "meetingMode": "", "triggerDrawingType": "BATHROOM", "triggerTaskType": "Bathroom Elevation Drawings", "scope": "Stage", "subtaskOrder": 3, "responsible": "", "hours": "", "completionUploadRequired": true, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-09-04", "workflowVersion": "2", "milestone": "Bathroom Stone", "tasks": "Bathroom Stone", "startingMilestone": "Receive Bathroom 3Ds/Elevations \u00b7 bathroom/wall elevation zone wise", "subtask": "CL Meeting | Revision | Approval Final [Milestone]", "taskCategory": "Meeting", "meetingMode": "Phone / Zoom allowed", "triggerDrawingType": "BATHROOM", "triggerTaskType": "Bathroom Elevation Drawings", "scope": "Stage", "subtaskOrder": 4, "responsible": "", "hours": "", "completionUploadRequired": false, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-10-01", "workflowVersion": "2", "milestone": "Facade", "tasks": "Facade", "startingMilestone": "Receive Facade 3Ds/Elevations \u00b7 facade/wall elevation", "subtask": "3D Renders", "taskCategory": "Design", "meetingMode": "", "triggerDrawingType": "FACADE", "triggerTaskType": "Facade Elevation Drawings", "scope": "Stage", "subtaskOrder": 1, "responsible": "", "hours": "", "completionUploadRequired": true, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-10-02", "workflowVersion": "2", "milestone": "Facade", "tasks": "Facade", "startingMilestone": "Receive Facade 3Ds/Elevations \u00b7 facade/wall elevation", "subtask": "Present & Discuss with CL | Architect", "taskCategory": "Meeting", "meetingMode": "In person", "triggerDrawingType": "FACADE", "triggerTaskType": "Facade Elevation Drawings", "scope": "Stage", "subtaskOrder": 2, "responsible": "", "hours": "", "completionUploadRequired": false, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-10-03", "workflowVersion": "2", "milestone": "Facade", "tasks": "Facade", "startingMilestone": "Receive Facade 3Ds/Elevations \u00b7 facade/wall elevation", "subtask": "Typical Section Detail | Draw | Approval Final [Milestone]", "taskCategory": "Design", "meetingMode": "", "triggerDrawingType": "FACADE", "triggerTaskType": "Facade Elevation Drawings", "scope": "Stage", "subtaskOrder": 3, "responsible": "", "hours": "", "completionUploadRequired": true, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-10-04", "workflowVersion": "2", "milestone": "Facade", "tasks": "Facade", "startingMilestone": "Receive Facade 3Ds/Elevations \u00b7 facade/wall elevation", "subtask": "Facade Mockup", "taskCategory": "Meeting", "meetingMode": "In person", "triggerDrawingType": "FACADE", "triggerTaskType": "Facade Elevation Drawings", "scope": "Stage", "subtaskOrder": 4, "responsible": "", "hours": "", "completionUploadRequired": false, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-11-01", "workflowVersion": "2", "milestone": "Furniture", "tasks": "Furniture", "startingMilestone": "Receive Furniture on-site or off-site docket from Architect", "subtask": "Typical Section Detail | Draw", "taskCategory": "Design", "meetingMode": "", "triggerDrawingType": "FURNITURE", "triggerTaskType": "Furniture / Joinery", "scope": "Stage", "subtaskOrder": 1, "responsible": "", "hours": "", "completionUploadRequired": true, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-11-02", "workflowVersion": "2", "milestone": "Furniture", "tasks": "Furniture", "startingMilestone": "Receive Furniture on-site or off-site docket from Architect", "subtask": "Arranging samples for production", "taskCategory": "Design", "meetingMode": "", "triggerDrawingType": "FURNITURE", "triggerTaskType": "Furniture / Joinery", "scope": "Stage", "subtaskOrder": 2, "responsible": "", "hours": "", "completionUploadRequired": true, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-11-03", "workflowVersion": "2", "milestone": "Furniture", "tasks": "Furniture", "startingMilestone": "Receive Furniture on-site or off-site docket from Architect", "subtask": "Meeting with Furniture Vendor | Architect", "taskCategory": "Meeting", "meetingMode": "In person", "triggerDrawingType": "FURNITURE", "triggerTaskType": "Furniture / Joinery", "scope": "Stage", "subtaskOrder": 3, "responsible": "", "hours": "", "completionUploadRequired": false, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}, {"id": "DESIGN-11-04", "workflowVersion": "2", "milestone": "Furniture", "tasks": "Furniture", "startingMilestone": "Receive Furniture on-site or off-site docket from Architect", "subtask": "Freeze Documentation", "taskCategory": "Design", "meetingMode": "", "triggerDrawingType": "FURNITURE", "triggerTaskType": "Furniture / Joinery", "scope": "Stage", "subtaskOrder": 4, "responsible": "", "hours": "", "completionUploadRequired": true, "optional": false, "executionNote": "Consolidate drawings for final approval before site issue; record meeting minutes and plan engineer visits at key milestones."}];
const DESIGN_WORKFLOW_PDF_TEMPLATE = [{"id": "PDF-01-01", "workflowVersion": "1", "milestone": "Onboarding", "tasks": "Onboarding / Receive Layout", "subtask": "Folder Setup", "triggerDrawingType": "MANUAL", "triggerTaskType": "Onboarding", "scope": "Project", "responsible": "", "hours": "", "subtaskOrder": 1, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-01-02", "workflowVersion": "1", "milestone": "Onboarding", "tasks": "Onboarding / Receive Layout", "subtask": "Sheet Setup", "triggerDrawingType": "MANUAL", "triggerTaskType": "Onboarding", "scope": "Project", "responsible": "", "hours": "", "subtaskOrder": 2, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-01-03", "workflowVersion": "1", "milestone": "Onboarding", "tasks": "Onboarding / Receive Layout", "subtask": "Zoning & Keypad Location", "triggerDrawingType": "MANUAL", "triggerTaskType": "Onboarding", "scope": "Project", "responsible": "", "hours": "", "subtaskOrder": 3, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-01-04", "workflowVersion": "1", "milestone": "Onboarding", "tasks": "Onboarding / Receive Layout", "subtask": "Technical Table Setup", "triggerDrawingType": "MANUAL", "triggerTaskType": "Onboarding", "scope": "Project", "responsible": "", "hours": "", "subtaskOrder": 4, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-01-05", "workflowVersion": "1", "milestone": "Onboarding", "tasks": "Onboarding / Receive Layout", "subtask": "Zone Table with Area and Status", "triggerDrawingType": "MANUAL", "triggerTaskType": "Onboarding", "scope": "Project", "responsible": "", "hours": "", "subtaskOrder": 5, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-02-01", "workflowVersion": "1", "milestone": "Brief from Client & Architect", "tasks": "Brief from Client & Architect", "subtask": "Meeting", "triggerDrawingType": "MANUAL", "triggerTaskType": "Client / Architect Brief", "scope": "Project", "responsible": "", "hours": "", "subtaskOrder": 1, "completionUploadRequired": false, "executionNote": "", "optional": false}, {"id": "PDF-03-01", "workflowVersion": "1", "milestone": "Concept", "tasks": "Concept / Freeze Products", "subtask": "Initial Concept", "triggerDrawingType": "LAYOUT", "triggerTaskType": "Concept | 2D", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 1, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-03-02", "workflowVersion": "1", "milestone": "Concept", "tasks": "Concept / Freeze Products", "subtask": "Meeting with CL / Architect to understand Theme", "triggerDrawingType": "LAYOUT", "triggerTaskType": "Concept | 2D", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 2, "completionUploadRequired": false, "executionNote": "", "optional": false}, {"id": "PDF-03-03", "workflowVersion": "1", "milestone": "Concept", "tasks": "Concept / Freeze Products", "subtask": "Present & Discuss with CL / Architect", "triggerDrawingType": "LAYOUT", "triggerTaskType": "Concept | 2D", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 3, "completionUploadRequired": false, "executionNote": "", "optional": false}, {"id": "PDF-04-01", "workflowVersion": "1", "milestone": "Concept", "tasks": "Preliminary Budgeting", "subtask": "Preliminary Budgeting", "triggerDrawingType": "LAYOUT", "triggerTaskType": "Preliminary Budgeting", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 1, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-05-01", "workflowVersion": "1", "milestone": "Control Finalisation", "tasks": "Control Finalisation", "subtask": "Showcase Wireless / Wired Options with budget", "triggerDrawingType": "LAYOUT", "triggerTaskType": "Control Finalisation", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 1, "completionUploadRequired": false, "executionNote": "Conduiting and box fixing at civil stage", "optional": false}, {"id": "PDF-05-02", "workflowVersion": "1", "milestone": "Control Finalisation", "tasks": "Control Finalisation", "subtask": "Showroom Visits [if required]", "triggerDrawingType": "LAYOUT", "triggerTaskType": "Control Finalisation", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 2, "completionUploadRequired": false, "executionNote": "Conduiting and box fixing at civil stage", "optional": true}, {"id": "PDF-05-03", "workflowVersion": "1", "milestone": "Control Finalisation", "tasks": "Control Finalisation", "subtask": "Discuss & Close", "triggerDrawingType": "LAYOUT", "triggerTaskType": "Control Finalisation", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 3, "completionUploadRequired": false, "executionNote": "Conduiting and box fixing at civil stage", "optional": false}, {"id": "PDF-06-01", "workflowVersion": "1", "milestone": "Wall Electrical | LUI", "tasks": "Keypad & Lamp Socket Locations", "subtask": "Meeting with Controls Vendor / CL / Architect [if required]", "triggerDrawingType": "WE", "triggerTaskType": "Wall Electrical Drawings", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 1, "completionUploadRequired": false, "executionNote": "", "optional": true}, {"id": "PDF-06-02", "workflowVersion": "1", "milestone": "Wall Electrical | LUI", "tasks": "Keypad & Lamp Socket Locations", "subtask": "Lighting User Interface / Draw", "triggerDrawingType": "WE", "triggerTaskType": "Wall Electrical Drawings", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 2, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-06-03", "workflowVersion": "1", "milestone": "Wall Electrical | LUI", "tasks": "Keypad & Lamp Socket Locations", "subtask": "Issue & Discuss / Revision / Approval Final", "triggerDrawingType": "WE", "triggerTaskType": "Wall Electrical Drawings", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 3, "completionUploadRequired": false, "executionNote": "", "optional": false}, {"id": "PDF-07-01", "workflowVersion": "1", "milestone": "False Ceiling Corrections", "tasks": "False Ceiling Corrections", "subtask": "Design Development / Freeze Product", "triggerDrawingType": "FC", "triggerTaskType": "False Ceiling Drawings", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 1, "completionUploadRequired": true, "executionNote": "Issue - brief & review", "optional": false}, {"id": "PDF-07-02", "workflowVersion": "1", "milestone": "False Ceiling Corrections", "tasks": "False Ceiling Corrections", "subtask": "Typical Section Detail / Draw", "triggerDrawingType": "FC", "triggerTaskType": "False Ceiling Drawings", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 2, "completionUploadRequired": true, "executionNote": "Issue - brief & review", "optional": false}, {"id": "PDF-07-03", "workflowVersion": "1", "milestone": "False Ceiling Corrections", "tasks": "False Ceiling Corrections", "subtask": "Issue & Discuss / Revision / Approval Final", "triggerDrawingType": "FC", "triggerTaskType": "False Ceiling Drawings", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 3, "completionUploadRequired": false, "executionNote": "Issue - brief & review", "optional": false}, {"id": "PDF-08-01", "workflowVersion": "1", "milestone": "Night Renders", "tasks": "Night Renders", "subtask": "3D Renders", "triggerDrawingType": "3D", "triggerTaskType": "3D Renders", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 1, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-08-02", "workflowVersion": "1", "milestone": "Night Renders", "tasks": "Night Renders", "subtask": "Product Assessment / Mockup / Freeze", "triggerDrawingType": "3D", "triggerTaskType": "3D Renders", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 2, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-09-01", "workflowVersion": "1", "milestone": "Wiring Drawings & Documentation", "tasks": "Lighting Layout / RCP / CIR", "subtask": "RCP / FLR / CIR / Draw", "triggerDrawingType": "FC WITH AC / FAN", "triggerTaskType": "Lighting Layout / Wiring", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 1, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-09-02", "workflowVersion": "1", "milestone": "Wiring Drawings & Documentation", "tasks": "Lighting Layout / RCP / CIR", "subtask": "Issue & Discuss / Revision / Approval Final", "triggerDrawingType": "FC WITH AC / FAN", "triggerTaskType": "Lighting Layout / Wiring", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 2, "completionUploadRequired": false, "executionNote": "", "optional": false}, {"id": "PDF-10-01", "workflowVersion": "1", "milestone": "Wiring Drawings & Documentation", "tasks": "Technical Table", "subtask": "Documentation / Tech Table", "triggerDrawingType": "FC WITH AC / FAN", "triggerTaskType": "Technical Table / Documentation", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 1, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-10-02", "workflowVersion": "1", "milestone": "Wiring Drawings & Documentation", "tasks": "Technical Table", "subtask": "Documentation / Luminaire Schedule", "triggerDrawingType": "FC WITH AC / FAN", "triggerTaskType": "Technical Table / Documentation", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 2, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-10-03", "workflowVersion": "1", "milestone": "Wiring Drawings & Documentation", "tasks": "Technical Table", "subtask": "Internal Review", "triggerDrawingType": "FC WITH AC / FAN", "triggerTaskType": "Technical Table / Documentation", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 3, "completionUploadRequired": false, "executionNote": "", "optional": false}, {"id": "PDF-10-04", "workflowVersion": "1", "milestone": "Wiring Drawings & Documentation", "tasks": "Technical Table", "subtask": "External Review", "triggerDrawingType": "FC WITH AC / FAN", "triggerTaskType": "Technical Table / Documentation", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 4, "completionUploadRequired": false, "executionNote": "", "optional": false}, {"id": "PDF-11-01", "workflowVersion": "1", "milestone": "Finalise Architectural Lighting", "tasks": "Finalise Architectural Lighting", "subtask": "External Review / Mockup / Discuss BOQ", "triggerDrawingType": "MANUAL", "triggerTaskType": "Finalise Architectural Lighting", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 1, "completionUploadRequired": false, "executionNote": "", "optional": false}, {"id": "PDF-11-02", "workflowVersion": "1", "milestone": "Finalise Architectural Lighting", "tasks": "Finalise Architectural Lighting", "subtask": "Arranging samples for CL Review", "triggerDrawingType": "MANUAL", "triggerTaskType": "Finalise Architectural Lighting", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 2, "completionUploadRequired": false, "executionNote": "", "optional": false}, {"id": "PDF-11-03", "workflowVersion": "1", "milestone": "Finalise Architectural Lighting", "tasks": "Finalise Architectural Lighting", "subtask": "Present final BOQ with colour test / Close", "triggerDrawingType": "MANUAL", "triggerTaskType": "Finalise Architectural Lighting", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 3, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-11-04", "workflowVersion": "1", "milestone": "Finalise Architectural Lighting", "tasks": "Finalise Architectural Lighting", "subtask": "Light Marking Sheet / Arrange All Samples", "triggerDrawingType": "MANUAL", "triggerTaskType": "Finalise Architectural Lighting", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 4, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-11-05", "workflowVersion": "1", "milestone": "Finalise Architectural Lighting", "tasks": "Finalise Architectural Lighting", "subtask": "Site Execution Sheet", "triggerDrawingType": "MANUAL", "triggerTaskType": "Finalise Architectural Lighting", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 5, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-12-01", "workflowVersion": "1", "milestone": "Bathroom Stone", "tasks": "Bathroom / Wall Elevation", "subtask": "3D Renders", "triggerDrawingType": "DETAIL", "triggerTaskType": "Bathroom Elevation", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 1, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-12-02", "workflowVersion": "1", "milestone": "Bathroom Stone", "tasks": "Bathroom / Wall Elevation", "subtask": "Design Development / Freeze Product", "triggerDrawingType": "DETAIL", "triggerTaskType": "Bathroom Elevation", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 2, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-12-03", "workflowVersion": "1", "milestone": "Bathroom Stone", "tasks": "Bathroom / Wall Elevation", "subtask": "Typical Section Detail / Draw", "triggerDrawingType": "DETAIL", "triggerTaskType": "Bathroom Elevation", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 3, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-12-04", "workflowVersion": "1", "milestone": "Bathroom Stone", "tasks": "Bathroom / Wall Elevation", "subtask": "CL Meeting / Revision / Approval Final", "triggerDrawingType": "DETAIL", "triggerTaskType": "Bathroom Elevation", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 4, "completionUploadRequired": false, "executionNote": "", "optional": false}, {"id": "PDF-13-01", "workflowVersion": "1", "milestone": "Facade", "tasks": "Facade / Wall Elevation", "subtask": "3D Renders", "triggerDrawingType": "FACADE", "triggerTaskType": "Facade Elevation Drawings", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 1, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-13-02", "workflowVersion": "1", "milestone": "Facade", "tasks": "Facade / Wall Elevation", "subtask": "Design Development / Freeze Product", "triggerDrawingType": "FACADE", "triggerTaskType": "Facade Elevation Drawings", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 2, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-13-03", "workflowVersion": "1", "milestone": "Facade", "tasks": "Facade / Wall Elevation", "subtask": "Typical Section Detail / Draw", "triggerDrawingType": "FACADE", "triggerTaskType": "Facade Elevation Drawings", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 3, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-13-04", "workflowVersion": "1", "milestone": "Facade", "tasks": "Facade / Wall Elevation", "subtask": "CL Meeting / Revision / Approval Final", "triggerDrawingType": "FACADE", "triggerTaskType": "Facade Elevation Drawings", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 4, "completionUploadRequired": false, "executionNote": "", "optional": false}, {"id": "PDF-14-01", "workflowVersion": "1", "milestone": "Furniture", "tasks": "Furniture / Wall Elevation", "subtask": "Design Development / Freeze Products", "triggerDrawingType": "FURNITURE", "triggerTaskType": "Furniture / Joinery", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 1, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-14-02", "workflowVersion": "1", "milestone": "Furniture", "tasks": "Furniture / Wall Elevation", "subtask": "Typical Section Detail / Draw", "triggerDrawingType": "FURNITURE", "triggerTaskType": "Furniture / Joinery", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 2, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-14-03", "workflowVersion": "1", "milestone": "Furniture", "tasks": "Furniture / Wall Elevation", "subtask": "Arranging samples for production", "triggerDrawingType": "FURNITURE", "triggerTaskType": "Furniture / Joinery", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 3, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-14-04", "workflowVersion": "1", "milestone": "Furniture", "tasks": "Furniture / Wall Elevation", "subtask": "Meeting with Furniture Vendor / Architect", "triggerDrawingType": "FURNITURE", "triggerTaskType": "Furniture / Joinery", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 4, "completionUploadRequired": false, "executionNote": "", "optional": false}, {"id": "PDF-14-05", "workflowVersion": "1", "milestone": "Furniture", "tasks": "Furniture / Wall Elevation", "subtask": "Freeze Documentation", "triggerDrawingType": "FURNITURE", "triggerTaskType": "Furniture / Joinery", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 5, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-15-01", "workflowVersion": "1", "milestone": "Decorative Lights / Art Curator", "tasks": "Concept & Decorative Selection", "subtask": "Initial Concept", "triggerDrawingType": "LAYOUT", "triggerTaskType": "Decorative Selection", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 1, "completionUploadRequired": true, "executionNote": "", "optional": false}, {"id": "PDF-15-02", "workflowVersion": "1", "milestone": "Decorative Lights / Art Curator", "tasks": "Concept & Decorative Selection", "subtask": "Meeting with CL / Architect to understand Theme", "triggerDrawingType": "LAYOUT", "triggerTaskType": "Decorative Selection", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 2, "completionUploadRequired": false, "executionNote": "", "optional": false}, {"id": "PDF-15-03", "workflowVersion": "1", "milestone": "Decorative Lights / Art Curator", "tasks": "Concept & Decorative Selection", "subtask": "Present & Discuss with CL / Architect", "triggerDrawingType": "LAYOUT", "triggerTaskType": "Decorative Selection", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 3, "completionUploadRequired": false, "executionNote": "", "optional": false}, {"id": "PDF-15-04", "workflowVersion": "1", "milestone": "Decorative Lights / Art Curator", "tasks": "Concept & Decorative Selection", "subtask": "Preliminary Budgeting", "triggerDrawingType": "LAYOUT", "triggerTaskType": "Decorative Selection", "scope": "Area", "responsible": "", "hours": "", "subtaskOrder": 4, "completionUploadRequired": true, "executionNote": "", "optional": false}];

function workflowGroups(rows) {
  const groups = new Map();
  rows.forEach(r => {
    const key = [r.milestone,r.tasks,r.triggerDrawingType,r.triggerTaskType,r.scope].join("|");
    if (!groups.has(key)) groups.set(key, {key,first:r,rows:[]});
    groups.get(key).rows.push(r);
  });
  return [...groups.values()];
}
function workflowActivationStatus(instances,task,sub,area,activation){
  const sameStage=t=>{
    if(t.parentDesignTaskId||String(t.workflowVersion)!=='2')return false;
    let snapshot=[];try{snapshot=JSON.parse(t.workflowTemplateSnapshot||'[]');}catch(_){}
    return t.lineWorkId===task.lineWorkId||snapshot.some(r=>r.lineWorkId===task.lineWorkId)||(!snapshot.length&&t.taskType===task.triggerTaskType&&drawingTypeKey(t.dependencyDrawingType)===drawingTypeKey(task.triggerDrawingType));
  };
  const covers=t=>{if(!area)return true;try{return JSON.parse(t.workflowCoverage||'[]').some(x=>String(x.floor)===String(area.floor)&&String(x.area)===String(area.area));}catch(_){return false;}};
  const stages=instances.filter(w=>sameStage(w.task||{})&&covers(w.task));
  const matching=instances.filter(w=>{
    const t=w.task||{};
    if(String(t.workflowVersion)==='2'&&!t.parentDesignTaskId)return !sub&&stages.includes(w);
    const sameTask=t.parentTask===task.tasks||t.taskType===task.triggerTaskType||t.parentTask===task.triggerTaskType;
    const inArea=!area||(String(t.floor)===String(area.floor)&&String(t.area)===String(area.area))||(!t.floor&&stages.some(p=>p.designTaskId===t.parentDesignTaskId));
    return sameTask&&inArea&&(!t.milestone||t.milestone===task.milestone)&&(!sub||t.lineWorkId===sub.lineWorkId||t.taskType===sub.subtask||t.subtask===sub.subtask);
  });
  if(!matching.length){
    if(stages.length)return sub?'Activated · awaiting parent start':'Activated';
    return activation?.status||'Not activated';
  }
  if(matching.every(w=>w.status==='Completed'))return 'Completed';
  if(matching.some(w=>['Started','In Progress','In progress'].includes(w.status)))return 'In progress';
  if(matching.some(w=>w.status==='Ready'))return 'Ready';
  if(!sub&&stages.length&&matching.every(w=>!w.task?.parentDesignTaskId))return 'Activated';
  return matching[0].status||'Waiting';
}
function ProjectLineOfWorkView({state,persist,selectedId}) {
  const projects = (state.projects || []).filter(p => p.completed!==true && ![p.status,p.projectStatus,p.projectControl?.projectStatus].some(v=>String(v||"").toLowerCase()==="completed"));
  const [projectId,setProjectId] = useState(selectedId || projects[0]?.id || "");
  const project = projects.find(p => String(p.id) === String(projectId)) || projects[0];
  const [rows,setRows] = useState([]);
  const [legacy,setLegacy] = useState([]);
  const [instances,setInstances] = useState([]);
  const [activationStates,setActivationStates]=useState({});
  const [editing,setEditing] = useState(false);
  const [busy,setBusy] = useState(false);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const [tab,setTab] = useState("template");
  const [areaKey,setAreaKey] = useState("");
  const [message,setMessage] = useState("");
  const [savedRows,setSavedRows] = useState([]);
  const [expandedGroup,setExpandedGroup]=useState(null);
  const [panel,setPanel]=useState(null);
  const [moreOpen,setMoreOpen]=useState(false);
  const revision = useRef(0);
  const savePendingRef=useRef(false);
  const rowId = r => String(r.lineWorkId || r.id);
  const setProjectRows = all => {
    const workflow = all.filter(r => ["1","2"].includes(String(r.workflowVersion))).map(r => ({...r,id:r.lineWorkId || r.id}));
    setRows(workflow); setSavedRows(workflow); setLegacy(all.filter(r => !["1","2"].includes(String(r.workflowVersion))));
  };
  useEffect(() => {
    let active = true; revision.current += 1;
    setEditing(false);setPanel(null);setExpandedGroup(null);setMoreOpen(false);setAreaKey("");setError("");setMessage("");setInstances([]);
    if (!project) {setProjectRows([]);return;}
    setProjectRows(project.lineOfWorkResidence || project.lineOfWork || []);
    setLoading(true);
    Promise.all([projectApi.listLineOfWork(project.id),projectApi.getWIH(true,project.id)]).then(([all,wih]) => {
      if (!active) return;
      setProjectRows(Array.isArray(all)?all:[]);setInstances(Array.isArray(wih)?wih:[]);
    }).catch(e => {if(active)setError(`Could not load workflow: ${e.message || e}`);}).finally(()=>{if(active)setLoading(false);});
    return () => {active=false;};
  },[project?.id]);
  const refresh = async () => {
    const token=revision.current;setBusy(true);setError("");
    try {const wih=await projectApi.getWIH(true,project.id);if(token===revision.current)setInstances(Array.isArray(wih)?wih:[]);}
    catch(e){if(token===revision.current)setError(e.message || String(e));}
    finally{setBusy(false);}
  };
  if (!project) return <div style={{color:T.inkDim}}>No active project available.</div>;
  const members = (state.teamMaster || []).filter(m => m.active !== false && String(m.active)!=="false");
  const people = [...new Set([...members.map(m=>String(m.name||"")),...(state.people||[]).map(String),...rows.map(r=>String(r.responsible||""))].filter(Boolean))];
  const groups = workflowGroups(rows);
  const zones = project.floorZones || Object.entries(project.zones || {}).map(([zoneCode,z])=>({zoneCode,floor:z.floor,area:z.room}));
  const areas = [...new Map([...zones,...instances.filter(w=>w.task?.area).map(w=>({floor:w.task.floor,area:w.task.area}))].filter(a=>a.floor&&a.area).map(a=>[JSON.stringify([String(a.floor),String(a.area)]),a])).entries()];
  const selectedArea = areas.find(([key])=>key===areaKey)?.[1];
  const mutate = (ids,patch) => setRows(rs=>rs.map(r=>ids.includes(rowId(r))?{...r,...patch}:r));
  const loadLegacy = () => {setRows(DESIGN_WORKFLOW_PDF_TEMPLATE.map(r=>({...r})));setEditing(true);setMessage("PDF template loaded. Review drawing triggers and assignments, then save to activate automation.");};
  const loadPdf=()=>{setRows(DESIGN_TASK_FLOW_TEMPLATE.map(r=>({...r})));setEditing(true);setMessage("Latest Design Task PDF loaded: pink in-person meetings, purple phone/Zoom meetings, white floor-wise design work. Save to activate.");};
  const save = async () => {
    if(savePendingRef.current)return;
    if(rows.some(r=>!String(r.milestone||'').trim()||!String(r.tasks||'').trim()||!String(r.subtask||'').trim()||!String(r.triggerTaskType||'').trim()))return setError('Each workflow row needs a milestone, task, subtask, and trigger task.');
    const token=revision.current,previousPanel=panel,previousSaved=savedRows;
    const before=state.projects.find(p=>p.id===project.id);
    const order={},clean=rows.map(r=>{const key=[r.milestone,r.tasks,r.triggerDrawingType,r.triggerTaskType,r.scope].join('|');order[key]=(order[key]||0)+1;return {...r,workflowVersion:r.workflowVersion||'1',subtaskOrder:order[key],completionUploadRequired:r.completionUploadRequired!==false&&String(r.completionUploadRequired)!=='false',optional:r.optional===true||String(r.optional)==='true'};});
    const optimistic=[...legacy,...clean];
    savePendingRef.current=true;setBusy(true);setError('');setPanel(null);setEditing(false);setRows(clean);setMessage('Changes applied · Saving workflow in the background…');
    try{
      await persist(latest=>({...latest,projects:latest.projects.map(p=>p.id===project.id?{...p,lineOfWorkResidence:optimistic,lineOfWork:optimistic}:p)}));
      const result=await projectApi.saveLineOfWork(project.id,optimistic);
      if(!Array.isArray(result)||!result.some(r=>['1','2'].includes(String(r.workflowVersion))))throw new Error('Update and redeploy the included Apps Script backend; workflow saving could not be confirmed.');
      await persist(latest=>({...latest,projects:latest.projects.map(p=>p.id===project.id?{...p,lineOfWorkResidence:result,lineOfWork:result}:p)}));
      if(token===revision.current){setProjectRows(result);setMessage('Workflow saved to Google Sheets.');}
    }catch(e){
      await persist(latest=>({...latest,projects:latest.projects.map(p=>{
        if(p.id!==project.id)return p;
        return {...p,...(JSON.stringify(p.lineOfWorkResidence)===JSON.stringify(optimistic)?{lineOfWorkResidence:before?.lineOfWorkResidence}:{}),...(JSON.stringify(p.lineOfWork)===JSON.stringify(optimistic)?{lineOfWork:before?.lineOfWork}:{})};
      })}));
      if(token===revision.current){setRows(clean);setSavedRows(previousSaved);setEditing(true);setPanel(previousPanel);setMessage('');setError(`${e.message||e} Your edits are retained. Save Changes to retry.`);}
    }finally{savePendingRef.current=false;setBusy(false);}
  };
  const queue = async g => {
    const r=g.first;if(!r.lineWorkId)return setError("Save the workflow first.");
    if(r.scope!=="Project"&&!selectedArea)return setError("Select the floor / area to queue this task.");
    setBusy(true);setError("");
    try {await projectApi.queueWorkflowTask({projectId:project.id,lineWorkId:r.lineWorkId,...(selectedArea?{floor:selectedArea.floor,area:selectedArea.area}:{})});setInstances(await projectApi.getWIH(true,project.id));setMessage("Task queued in Work in Hand. Start it there to open its ordered subtasks.");}
    catch(e){setError(e.message||String(e));}finally{setBusy(false);}
  };
  const fieldStyle={...inputStyle,padding:"7px 8px",fontSize:12};
  const chosenInstances = instances.filter(w=>selectedArea?String(w.task?.floor)===String(selectedArea.floor)&&String(w.task?.area)===String(selectedArea.area):true);
  const activationKey=r=>JSON.stringify([project.id,r.lineWorkId]);
  const workflowStatus=(task,sub)=>workflowActivationStatus(instances,task,sub,selectedArea,activationStates[activationKey(task)]);
  const cancelEdit=()=>{setRows(savedRows);setEditing(false);setPanel(null);setMessage('');setError('');};
  const addTask=()=>{const id=uid();setEditing(true);setMoreOpen(false);setRows(rs=>[...rs,{id,workflowVersion:'2',milestone:'New milestone',tasks:'New task',subtask:'New subtask',triggerDrawingType:'LAYOUT',triggerTaskType:'New task',scope:'Stage',taskCategory:'Design',meetingMode:'',startingMilestone:'Confirm prerequisite',completionUploadRequired:true}]);setExpandedGroup(id);setPanel({kind:'task',id});};
  const addSubtask=g=>{const id=uid(),last=g.rows[g.rows.length-1];setRows(rs=>{const index=rs.findIndex(x=>rowId(x)===rowId(last));return [...rs.slice(0,index+1),{...last,id,lineWorkId:'',subtask:'New subtask'},...rs.slice(index+1)];});setPanel({kind:'subtask',id});};
  const panelGroup=panel?groups.find(g=>g.rows.some(r=>rowId(r)===panel.id)):null;
  const panelRow=panel?.kind==='task'?panelGroup?.first:rows.find(r=>rowId(r)===panel?.id);
  const panelField=(label,key,type='text')=>{
    const value=panelRow?.[key]??'',ids=panel.kind==='task'?panelGroup.rows.map(rowId):[panel.id];
    const change=value=>mutate(ids,{[key]:value,...(key==='scope'&&value==='Project'?{triggerDrawingType:'MANUAL'}:{}),...(key==='taskCategory'?{meetingMode:value==='Meeting'?'In person':'',completionUploadRequired:value!=='Meeting'}:{})});
    const choices=type==='person'?['',...people]:type==='scope'?['Area','Project','Stage']:type==='type'?['Design','Meeting']:type==='meeting'?['In person','Phone / Zoom allowed']:type==='drawing'?[...new Set(['MANUAL','LAYOUT','WE','FC','DETAIL','3D',...(state.templates||[]).map(t=>drawingTypeKey(t.drawingType)),value].filter(Boolean))]:null;
    return <label style={{display:'grid',gap:6,marginBottom:16,fontFamily:FONT_BODY,fontSize:12,color:T.inkDim}}>{label}{!editing?<span style={{fontSize:13,color:T.ink,padding:'6px 0'}}>{type==='boolean'?(value!==false&&String(value)!=='false'&&key==='completionUploadRequired'||value===true||String(value)==='true'?'Yes':'No'):value!==''?value:(type==='person'?(panel.kind==='task'?'Unassigned':'Inherit task assignee / unassigned'):'—')}</span>:choices?<select aria-label={label} disabled={busy} style={fieldStyle} value={value} onChange={e=>change(e.target.value)}>{choices.map(v=><option key={v} value={v}>{v||(panel.kind==='task'?'Unassigned':'Inherit task assignee / unassigned')}</option>)}</select>:type==='boolean'?<input aria-label={label} disabled={busy} type="checkbox" checked={key==='completionUploadRequired'?value!==false&&String(value)!=='false':value===true||String(value)==='true'} onChange={e=>change(e.target.checked)}/>:<input aria-label={label} disabled={busy} style={fieldStyle} type={type==='hours'?'number':'text'} min={type==='hours'?0:undefined} step={type==='hours'?.25:undefined} value={value} onChange={e=>change(e.target.value)}/>}</label>;
  };
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:16}}>
      <div><h2 style={{fontFamily:FONT_DISPLAY,fontSize:20,margin:0}}>Design Line of Work</h2><div style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim,marginTop:5}}>Milestone → Task → Subtask. Assign once per project; each received floor / area follows its own workflow.</div></div>
      <select aria-label="Workflow project" disabled={busy||editing} style={{...fieldStyle,minWidth:280}} value={project.id} onChange={e=>setProjectId(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.no||"—"} · {p.name}</option>)}</select>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
      <Btn variant={tab==="template"?"dark":"ghost"} onClick={()=>setTab("template")}>Workflow</Btn><Btn variant={tab==="progress"?"dark":"ghost"} onClick={()=>{setTab("progress");refresh();}}>Progress</Btn><Btn variant={tab==="gantt"?"dark":"ghost"} onClick={()=>setTab("gantt")}>Gantt</Btn>
      <select aria-label="Workflow area" style={{...fieldStyle,minWidth:240,marginLeft:"auto"}} value={areaKey} onChange={e=>setAreaKey(e.target.value)}><option value="">All areas / select an area</option>{areas.map(([key,a])=><option key={key} value={key}>{a.floor} · {a.area}</option>)}</select>
    </div>
    {loading&&<div style={{color:T.inkDim,marginBottom:12}}>Loading project workflow…</div>}
    {error&&<div role="alert" style={{padding:12,background:T.redlineBg,color:T.redline,marginBottom:12}}>{error}</div>}
    {message&&<div role="status" style={{padding:12,background:T.paperDim,fontSize:12,marginBottom:12}}>{message}</div>}
    {tab==="gantt"?<ProjectGantt state={state} projectId={project.id}/>:tab==="template"?<>
      <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        {editing?<><Btn disabled={busy} onClick={save}>{busy?'Saving…':'Save Changes'}</Btn><Btn disabled={busy} variant="ghost" onClick={cancelEdit}>Cancel</Btn></>:!!rows.length&&<Btn disabled={busy||loading} onClick={()=>setEditing(true)}>Edit workflow</Btn>}
        <div style={{position:'relative',marginLeft:'auto'}}><button type="button" disabled={busy||loading} aria-expanded={moreOpen} onClick={()=>setMoreOpen(v=>!v)} style={{...smallBtn,padding:"10px 14px",fontFamily:FONT_BODY}}>More ▾</button>{moreOpen&&<div aria-label="Workflow actions" style={{position:'absolute',right:0,top:'100%',zIndex:20,background:T.paper,border:`1px solid ${T.line}`,padding:10,minWidth:250,display:'grid',gap:8,boxShadow:'0 8px 24px #08192d18'}}><button style={smallBtn} onClick={()=>{setMoreOpen(false);if(!rows.length||window.confirm('Load the default workflow into this draft? The saved workflow changes only after Save Changes.'))loadPdf();}}>Load default workflow</button>{!rows.length&&<button style={smallBtn} onClick={()=>{setMoreOpen(false);loadLegacy();}}>Load legacy area template</button>}<button style={smallBtn} onClick={addTask}>+ Add task</button></div>}</div>
      </div>
      {!rows.length&&<div style={{padding:24,border:`1px solid ${T.line}`,fontFamily:FONT_BODY,fontSize:13,color:T.inkDim}}>No workflow yet. Choose More → Load default workflow or Add task to get started.</div>}
      {!!rows.length&&<div style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim,marginBottom:12}}>Select a milestone to see its subtasks. Use Edit to change one task at a time.</div>}
      {groups.map(g=>{const r=g.first,key=rowId(r),open=expandedGroup===key,assigned=[...new Set(g.rows.map(s=>s.responsible).filter(Boolean))];return <section key={key} style={{border:`1px solid ${T.line}`,marginBottom:10,background:T.paper}}>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',background:T.paperDim}}><button type="button" aria-label={`Expand ${r.milestone} ${r.tasks}`} aria-expanded={open} onClick={()=>setExpandedGroup(open?null:key)} style={{flex:1,border:0,background:'transparent',padding:0,cursor:'pointer',textAlign:'left',color:T.ink,fontFamily:FONT_BODY,display:'grid',gridTemplateColumns:'minmax(180px,1fr) minmax(100px,160px) 110px',gap:12,alignItems:'center'}}><span><strong style={{fontFamily:FONT_DISPLAY,fontSize:14}}>{open?'▾':'▸'} {r.milestone}</strong>{r.tasks!==r.milestone&&<span style={{display:'block',fontSize:12,margin:'4px 0 0 15px'}}>{r.tasks}</span>}<span style={{display:'block',fontSize:11,color:T.inkDim,margin:'4px 0 0 15px'}}>{g.rows.length} subtasks · {r.scope||'Area'}</span></span><span style={{fontSize:12}}>{r.responsible|| (assigned.length===1?assigned[0]:assigned.length>1?'Multiple people':'Unassigned')}</span><span style={{fontSize:11,color:T.inkDim}}>{workflowStatus(r)}</span></button><button type="button" disabled={busy||loading} aria-label={`Edit task ${r.tasks}`} onClick={()=>{setEditing(true);setExpandedGroup(key);setPanel({kind:'task',id:key});}} style={smallBtn}>Edit</button></div>
        {open&&<div style={{padding:14}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:12,fontFamily:FONT_BODY,fontSize:12,color:T.inkDim}}><span>{r.startingMilestone?`Starts after: ${r.startingMilestone}`:r.triggerDrawingType==='MANUAL'?'Manually queued':`Drawing: ${r.triggerDrawingType||'—'}`}</span><button style={smallBtn} onClick={()=>setPanel({kind:'task',id:key})}>Task details</button></div>
          {!editing&&String(r.workflowVersion)==='2'&&<StageActivationPanel state={state} project={project} row={r} disabled={busy||!r.lineWorkId} onActivationState={status=>setActivationStates(x=>({...x,[activationKey(r)]:{status}}))} onActivated={async task=>{
            if(workflowProjectRef.current!==project.id)return;
            const token=revision.current;
            if(task?.designTaskId)setInstances(list=>[...list.filter(w=>w.designTaskId!==task.designTaskId),{designTaskId:task.designTaskId,status:task.status,task}]);
            try{const list=await projectApi.getWIH(true,project.id);if(token===revision.current)setInstances(list);}catch(e){throw Error('Activation saved, but status refresh failed. Refresh the workflow to check it.');}
          }}/>}
          {!editing&&String(r.workflowVersion)!=='2'&&<Btn disabled={busy||loading||!r.lineWorkId} variant="ghost" onClick={()=>queue(g)} style={{marginBottom:12}}>{r.scope==='Project'?'Queue project task':'Queue for selected area'}</Btn>}
          <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:560}}><thead><tr>{['Subtask','Responsible','Status',''].map((h,i)=><th key={i} style={{...thStyle,textAlign:'left',background:T.paperDim,color:T.ink,fontSize:10}}>{h}</th>)}</tr></thead><tbody>{g.rows.map((sub,i)=><tr key={rowId(sub)} style={{background:'#fff'}}><td style={{...tdStyle,textAlign:'left',padding:'12px 10px'}}><span style={{color:T.inkDim,marginRight:8}}>{i+1}.</span>{sub.subtask}{sub.taskCategory==='Meeting'&&<span style={{display:'inline-block',fontSize:10,padding:'2px 6px',marginLeft:8,background:sub.meetingMode==='Phone / Zoom allowed'?'#B4A5D7':'#D7A5BF'}}>{sub.meetingMode==='Phone / Zoom allowed'?'Call / Zoom':'Meeting'}</span>}</td><td style={{...tdStyle,textAlign:'left'}}>{sub.responsible||r.responsible||'Unassigned'}</td><td style={{...tdStyle,textAlign:'left',fontSize:11,color:T.inkDim}}>{workflowStatus(r,sub)}</td><td style={{...tdStyle,textAlign:'right'}}><button type="button" disabled={busy} aria-label={`Details ${sub.subtask}`} style={smallBtn} onClick={()=>setPanel({kind:'subtask',id:rowId(sub)})}>{editing?'Edit':'Details'}</button></td></tr>)}</tbody></table></div>
          {editing&&<button disabled={busy} style={{...smallBtn,marginTop:12}} onClick={()=>addSubtask(g)}>+ Add subtask</button>}
        </div>}
      </section>;})}
      {!!legacy.length&&<div style={{fontSize:11,color:T.inkDim,marginTop:12}}>{legacy.length} previous Line of Work rows retained.</div>}
    </>:<>
      <Btn disabled={busy} variant="ghost" onClick={refresh} style={{marginBottom:12}}>Refresh progress</Btn>
      {!selectedArea&&<div style={{overflowX:"auto",marginBottom:16}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Floor","Area","Workflow subtasks","Completed","Ready / in progress","Waiting","Action"].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead><tbody>{areas.map(([key,a])=>{const list=instances.filter(w=>w.task?.parentDesignTaskId&&String(w.task.floor)===String(a.floor)&&String(w.task.area)===String(a.area));const done=list.filter(w=>w.status==="Completed").length,blocked=list.filter(w=>w.status==="Blocked").length;return <tr key={key}><td style={tdStyle}>{a.floor}</td><td style={tdStyle}>{a.area}</td><td style={tdStyle}>{list.length||"Not activated"}</td><td style={tdStyle}>{done}</td><td style={tdStyle}>{list.length-done-blocked}</td><td style={tdStyle}>{blocked}</td><td style={tdStyle}><button style={smallBtn} onClick={()=>setAreaKey(key)}>View workflow</button></td></tr>;})}</tbody></table></div>}
      <div style={{fontSize:12,color:T.inkDim,marginBottom:12}}>Progress is read from the same task records as Work in Hand. Start, pause and complete work in WIH.</div>
      {!chosenInstances.length&&<div style={{padding:18,color:T.inkDim}}>No activated tasks yet. Classify drawings for the covered areas, then start the assigned parent task in WIH.</div>}
      {chosenInstances.map(w=><div key={w.designTaskId} style={{padding:"12px 14px",border:`1px solid ${T.line}`,borderLeft:`3px solid ${w.task?.parentDesignTaskId?T.cyan:T.navy}`,marginBottom:8,marginLeft:w.task?.parentDesignTaskId?16:0,display:"flex",gap:12,justifyContent:"space-between",fontFamily:FONT_BODY,fontSize:12}}><div><strong>{w.task?.taskType||"Task"}</strong><div style={{color:T.inkDim,fontSize:11,marginTop:4}}>{(w.task?.drawingReviewRequired===true||String(w.task?.drawingReviewRequired)==="true")&&<span style={{color:T.orange}}>Drawing review required · </span>}{w.task?.milestone} {w.task?.parentTask?`→ ${w.task.parentTask}`:""} · {w.task?.floor||"Project"} · {w.task?.area||"Shared"}</div></div><div>{w.assigneeName||"Unassigned"} · <strong>{w.status}</strong></div></div>)}
    </>}
    {panel&&panelRow&&<div role="dialog" aria-modal="true" aria-labelledby="workflow-editor-title" onKeyDown={e=>{if(e.key==='Escape'&&!busy)setPanel(null);if(e.key==='Tab'){const list=[...e.currentTarget.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),summary')];const first=list[0],last=list[list.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}} style={{position:'fixed',inset:0,zIndex:14500,background:'rgba(8,25,45,.4)',display:'flex',justifyContent:'flex-end'}}><div style={{width:520,maxWidth:'100%',height:'100%',background:T.paper,display:'flex',flexDirection:'column',boxShadow:'-8px 0 30px #08192d20',fontFamily:FONT_BODY}}>
      <div style={{padding:'18px 20px',borderBottom:`1px solid ${T.line}`,display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}><h3 id="workflow-editor-title" style={{fontFamily:FONT_DISPLAY,fontSize:18,margin:0}}>{panel.kind==='task'?'Task settings':'Subtask details'}</h3><button type="button" autoFocus disabled={busy} aria-label="Close workflow details" style={smallBtn} onClick={()=>setPanel(null)}>Close</button></div>
      <div style={{padding:20,overflowY:'auto',flex:1}}>
        {error&&<p role="alert" style={{fontSize:13,color:T.redline}}>{error}</p>}
        {panel.kind==='task'?<>
          {panelField('Milestone','milestone')}{panelField('Task','tasks')}{panelField('Responsible','responsible','person')}
          <details style={{marginTop:16,borderTop:`1px solid ${T.line}`,paddingTop:12}}><summary style={{cursor:'pointer',fontSize:13,fontWeight:600}}>More settings</summary><div style={{marginTop:16}}>{panelField('Starting milestone','startingMilestone')}{panelField('Scope','scope','scope')}{panelField('Required drawing','triggerDrawingType','drawing')}{panelField('Task started in WIH','triggerTaskType')}{panelRow.executionNote&&<p style={{fontSize:12,color:T.inkDim}}>Execution handoff: {panelRow.executionNote}</p>}</div></details>
        </>:<>
          {panelField('Subtask','subtask')}{panelField('Responsible','responsible','person')}
          <div style={{fontSize:12,color:T.inkDim,marginBottom:16}}>Status: {workflowStatus(panelGroup?.first||panelRow,panelRow)}</div>
          <details style={{borderTop:`1px solid ${T.line}`,paddingTop:12}}><summary style={{cursor:'pointer',fontSize:13,fontWeight:600}}>More settings</summary><div style={{marginTop:16}}>{panelField('Type','taskCategory','type')}{panelRow.taskCategory==='Meeting'&&panelField('Meeting mode','meetingMode','meeting')}{panelField('Estimated hours','hours','hours')}{panelField('Output required','completionUploadRequired','boolean')}{panelField('Optional','optional','boolean')}</div></details>
          {editing&&<button type="button" disabled={busy} onClick={()=>{if(window.confirm(`Remove ${panelRow.subtask} from this workflow draft?`)){setRows(rs=>rs.filter(r=>rowId(r)!==panel.id));setPanel(null);}}} style={{...smallBtn,color:T.redline,marginTop:24}}>Remove subtask</button>}
        </>}
      </div>
      <div style={{padding:'16px 20px',borderTop:`1px solid ${T.line}`,display:'flex',gap:8,justifyContent:'flex-end'}}><Btn variant="ghost" disabled={busy} onClick={()=>setPanel(null)}>Back to overview</Btn>{editing?<Btn disabled={busy} onClick={save}>{busy?'Saving…':'Save Changes'}</Btn>:<Btn disabled={busy} onClick={()=>setEditing(true)}>Edit</Btn>}</div>
    </div></div>}
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
    ["terrace","Terrace"],["facade","Facade"],["landscape","Landscape"],
    ["bath_elevation","Bath Elevation"],["wardrobe","Furniture"],["art_curation","Art Curation"]];
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


const SHEET_DASHBOARD_WORK = [
  {label:'Finalise Controls',match:/control finalisation|finalise controls/i},
  {label:'Wall Elec Drawings',match:/wall electrical|lighting user interface/i,legacy:'wallElectrical'},
  {label:'Concept',match:/concept.*freeze|concept.*2d|initial concept/i,legacy:'concept'},
  {label:'FC Drawings',match:/false ceiling|fc corrections/i,legacy:'falseCeiling'},
  {label:'3D Renders',match:/night renders|^3d renders$/i,legacy:'renders3d'},
  {label:'Wiring Drawings',match:/lighting layout|wiring drawings|rcp\/flr\/cir/i,legacy:'light'},
  {label:'Finalise Architectural Lighting',match:/finalise architectural|architectural lighting/i},
  {label:'Bathroom Stone Drawings',scopeKey:'bath_elevation',match:/bathroom|bath elevation/i,legacy:'bathroomElevation'},
  {label:'Facade Elevation Drawings',match:/facade/i,legacy:'facadeElevation'},
  {label:'Furniture Drawings',scopeKey:'wardrobe',match:/furniture|joinery/i,legacy:'furniture'},
  {label:'Finalize Decorative Lighting',scopeKey:'art_curation',match:/decorative/i,legacy:'decorativeSelection'}
];
function sheetDashboardFlag(value){return value===true||String(value).toLowerCase()==='true'||value===1;}
function sheetDashboardStatus(records){
  if(!records.length)return '';
  const statuses=records.map(r=>String(r.actualStatus||r.status||'').toLowerCase());
  if(statuses.every(s=>/completed|^done$/.test(s)))return 'Completed';
  if(statuses.some(s=>/review/.test(s)))return 'Up for review';
  if(statuses.some(s=>/progress|^started$|paused|completed|^done$/.test(s)))return 'In-progress';
  if(records.some(r=>r.plannedStartDate)&&statuses.some(s=>/ready|not started|assigned/.test(s)))return 'Aligned';
  if(statuses.some(s=>/ready|assigned|^open$/.test(s)))return 'Open';
  return 'Pending';
}
function sheetDashboardTone(status){
  return ({Pending:{bg:'#F4E5E0',fg:'#853D32'},Open:{bg:'#E8F2E9',fg:'#245C2B'},Aligned:{bg:'#F3F1EA',fg:'#625B48'},'In-progress':{bg:'#FFF4D6',fg:'#7A5A00'},'Up for review':{bg:'#E6EEF4',fg:'#1D4E89'},Completed:{bg:'#E8E3EF',fg:'#58416E'}})[status]||{bg:'transparent',fg:T.ink};
}
function sheetDashboardCovers(record,zone,parents){
  const eq=(a,b)=>String(a||'').trim().toLowerCase()===String(b||'').trim().toLowerCase();
  if(record.floor||record.area)return eq(record.floor,zone.floor)&&eq(record.area,zone.area||zone.room);
  const parent=record.parentDesignTaskId?parents.get(String(record.parentDesignTaskId)):record;
  try{return JSON.parse(parent?.workflowCoverage||'[]').some(c=>eq(c.floor,zone.floor)&&eq(c.area,zone.area||zone.room));}catch(_){return false;}
}
const DESIGN_DASHBOARD_LOADS={active:0,waiting:[]};
function queueDesignDashboardLoad(work){
  return new Promise((resolve,reject)=>{
    DESIGN_DASHBOARD_LOADS.waiting.push({work,resolve,reject});
    const drain=()=>{
      while(DESIGN_DASHBOARD_LOADS.active<2&&DESIGN_DASHBOARD_LOADS.waiting.length){
        const job=DESIGN_DASHBOARD_LOADS.waiting.shift();DESIGN_DASHBOARD_LOADS.active++;
        Promise.resolve().then(job.work).then(job.resolve,job.reject).finally(()=>{DESIGN_DASHBOARD_LOADS.active--;drain();});
      }
    };
    drain();
  });
}
function DrawingControlDashboard({state,projectId,deferLoad=false}){
  const project=(state.projects||[]).find(p=>String(p.id)===String(projectId));
  const [payload,setPayload]=useState(null),[wih,setWih]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[revision,setRevision]=useState(0),[floor,setFloor]=useState('All');
  const sectionRef=useRef(null),[ready,setReady]=useState(!deferLoad),[showHours,setShowHours]=useState(false);
  useEffect(()=>setShowHours(false),[project?.id]);
  const layoutRef=useRef(null),[fullTableWidth,setFullTableWidth]=useState(0);
  useEffect(()=>{
    const layout=layoutRef.current;if(!layout)return;
    const measure=()=>{const width=layout.getBoundingClientRect?.().width||layout.clientWidth||0;if(width>0)setFullTableWidth(Math.max(0,Math.floor(width)-2));};
    measure();
    if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(measure);observer.observe(layout);return()=>observer.disconnect();}
    window.addEventListener?.('resize',measure);return()=>window.removeEventListener?.('resize',measure);
  },[project?.id]);
  useEffect(()=>{
    if(ready)return;
    if(typeof IntersectionObserver==='undefined'){setReady(true);return;}
    const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setReady(true);observer.disconnect();}},{rootMargin:'500px 0px'});
    if(sectionRef.current)observer.observe(sectionRef.current);
    return()=>observer.disconnect();
  },[ready]);
  useEffect(()=>{let live=true;setPayload(null);setWih([]);setLoading(true);setError('');setFloor('All');
    if(!project?.id){setLoading(false);return()=>{live=false;};}
    if(!ready)return()=>{live=false;};
    queueDesignDashboardLoad(()=>live?Promise.all([projectApi.getDesignDashboard(project.id),projectApi.getWIH(true,project.id)]):[null,[]]).then(([dashboard,work])=>{if(live){setPayload(dashboard);setWih(Array.isArray(work)?work:[]);}}).catch(e=>{if(live)setError(e.message||'Could not load dashboard data.');}).finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;};
  },[project?.id,revision,ready]);
  if(!project)return <p>No active project available.</p>;
  const eq=(a,b)=>String(a||'').trim().toLowerCase()===String(b||'').trim().toLowerCase();
  const allZones=(Array.isArray(payload?.floorZones)?payload.floorZones:project.floorZones||Object.entries(project.zones||{}).map(([zoneCode,z])=>({zoneCode,floor:z.floor,area:z.room}))).filter(z=>z.floor&&(z.area||z.room));
  const unique=[...new Map(allZones.map(z=>[JSON.stringify([z.floor,z.area||z.room]),z])).values()];
  const zones=unique.filter(z=>floor==='All'||z.floor===floor);
  const tasksMap=new Map((payload?.tasks||[]).map(t=>[String(t.designTaskId),{...t}]));
  wih.forEach(w=>{const id=String(w.designTaskId);tasksMap.set(id,{...(tasksMap.get(id)||{}),...(w.task||{}),actualStatus:w.status});});
  const tasks=[...tasksMap.values()],parents=new Map(tasks.map(t=>[String(t.designTaskId),t]));
  const logs=wih.filter(r=>/completed|done/i.test(String(r.status||r.task?.status||''))).map(r=>({person:r.assigneeName||r.task?.assigneeName||'Unassigned',duration:Number(r.totalMinutes||0)/60}));
  const totalHours=logs.reduce((sum,r)=>sum+r.duration,0),personHours=Object.entries(logs.reduce((sum,r)=>{sum[r.person]=(sum[r.person]||0)+r.duration;return sum;},{})).sort((a,b)=>b[1]-a[1]);
  const workColumns=SHEET_DASHBOARD_WORK.filter(def=>!def.scopeKey||sheetDashboardFlag(project.scope?.[def.scopeKey]));
  const receivedCols=[['Layout','layoutReceived'],['FC','fcReceived'],['Detail','detailReceived'],['3D','3dReceived']];
  const cell={padding:'2px 5px',border:`1px solid ${T.line}`,fontFamily:FONT_BODY,fontSize:10,verticalAlign:'middle',height:20,lineHeight:1.2,whiteSpace:'normal',overflowWrap:'anywhere'};
  const headerDivider='2px solid #B8B5AC';
  const head={...cell,background:'#D2CDC1',color:'#1C1C19',fontFamily:FONT_MONO,fontSize:9,borderBottom:`2px solid ${T.ink}`,fontWeight:700,textAlign:'center',whiteSpace:'normal',height:62,...(showHours?{overflowWrap:'normal',wordBreak:'normal',hyphens:'none'}:{})};
  const displayStatus=(status,date,title,key)=>{const tone=sheetDashboardTone(status);return <td key={key} title={title||status||'No linked task'} style={{...cell,background:tone.bg,color:tone.fg,textAlign:'left',lineHeight:1.2}}>{status}{status==='Completed'&&date&&<div style={{fontSize:8}}>{String(date).slice(0,10)}</div>}</td>;};
  const liveWork=(def,z,dbRow)=>{
    let records=tasks.filter(t=>def.match.test(String(t.parentTask||t.taskType||''))&&sheetDashboardCovers(t,z,parents));
    const children=records.filter(t=>t.parentDesignTaskId);if(children.length)records=children;
    if(records.length)return {status:sheetDashboardStatus(records),date:records.map(t=>t.completedAt||'').filter(Boolean).sort().pop(),title:records.map(t=>[t.designNo,t.taskType,t.actualStatus||t.status].filter(Boolean).join(' · ')).join('\n')};
    const key=def.legacy;
    if(key&&(dbRow?.[key+'TaskId']||dbRow?.[key+'DesignNo']))return {status:sheetDashboardStatus([{status:dbRow[key+'Status']}]),date:'',title:dbRow[key+'DesignNo']||''};
    return {status:'',date:'',title:''};
  };
  return <div ref={sectionRef}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:16}}><h2 style={{fontFamily:FONT_DISPLAY,fontSize:30,fontWeight:700,margin:0}}>System Design</h2><div style={{display:'flex',gap:8,alignItems:'center'}}><label style={{fontSize:12}}>Floor <select aria-label="Dashboard floor" value={floor} onChange={e=>setFloor(e.target.value)} style={{...inputStyle,width:130}}><option>All</option>{[...new Set(unique.map(z=>z.floor))].map(f=><option key={f}>{f}</option>)}</select></label><Btn disabled={loading} variant="ghost" onClick={()=>setRevision(x=>x+1)}>Refresh Dashboard</Btn></div></div>
    {error&&<p role="alert" style={{color:T.redline}}>{error}</p>}
    {loading&&<p style={{fontFamily:FONT_BODY,fontSize:13,color:T.inkDim}}>{ready?'Loading project drawings and WIH status…':'Drawing details load as you scroll to this project.'}</p>}
    <div ref={layoutRef} style={{display:'grid',gridTemplateColumns:showHours?'minmax(0,1fr) 330px':'minmax(0,1fr)',gap:showHours?16:0,alignItems:'start',width:'100%',minWidth:0}}>
      <div style={{minWidth:0,background:'#fff'}}>
        <table style={{width:'100%',borderCollapse:'collapse',marginBottom:8}}><tbody>{[[`Project ${project.no||project.projectNo||''}:`,project.name],['Start Date:',formatProjectDate(project.startDate)],['Time in hours:',loading?'Loading…':totalHours.toFixed(1)]].map(([label,value])=><tr key={label}><td style={{...cell,fontFamily:FONT_BODY,fontWeight:700,width:220}}>{label}</td><td style={{...cell,fontFamily:FONT_BODY}}>{label==='Time in hours:'?<div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}><span>{value}</span><button type="button" aria-label={`Hours by person for ${project.name}`} aria-expanded={showHours} aria-controls={`project-hours-${project.id}`} style={{...smallBtn,fontFamily:FONT_BODY,fontSize:12}} onClick={()=>setShowHours(open=>!open)}>{showHours?'Hide hours by person':'Hours by person'}</button></div>:value}</td></tr>)}</tbody></table>

        <div role={showHours?'region':undefined} aria-label={showHours?`Scrollable design table for ${project.name}`:undefined} tabIndex={showHours?0:undefined} style={{width:'100%',minWidth:0,overflowX:showHours?'auto':'visible',border:`1px solid ${T.line}`,boxSizing:'border-box'}}>
          <table aria-label="Project design matrix" style={{borderCollapse:'collapse',tableLayout:'fixed',width:'100%',...(showHours?{minWidth:Math.max(fullTableWidth,568+112*workColumns.length)}:{})}}>
            <colgroup><col style={{width:showHours?56:'4%'}}/><col style={{width:showHours?48:'4%'}}/><col style={{width:showHours?240:'20%'}}/>{Array.from({length:4},(_,i)=><col key={'r'+i} style={{width:showHours?56:'4%'}}/>)}{workColumns.map(d=><col key={d.label} style={{width:showHours?112:`${56/workColumns.length}%`}}/>)}</colgroup>
            <thead><tr><th colSpan={3} style={{...cell,background:'#D2CDC1',color:'#1C1C19',fontFamily:FONT_MONO,fontWeight:700,borderBottom:'1px solid #B8B5AC'}}/><th colSpan={4} style={{...cell,background:'#D2CDC1',color:'#1C1C19',fontFamily:FONT_MONO,fontWeight:700,borderBottom:'1px solid #B8B5AC',borderLeft:headerDivider,borderRight:headerDivider,textAlign:'center'}}>Drawings Received</th><th colSpan={workColumns.length} style={{...cell,background:'#D2CDC1',color:'#1C1C19',fontFamily:FONT_MONO,fontWeight:700,borderBottom:'1px solid #B8B5AC',textAlign:'center'}}>Work Status</th></tr><tr>{['FLR','CN','AREA'].map(h=><th key={h} style={{...head,textAlign:'left'}}>{h}</th>)}{receivedCols.map(([label],index)=><th key={label} style={{...head,...(index===0?{borderLeft:headerDivider}:{}),...(index===receivedCols.length-1?{borderRight:headerDivider}:{})}}>{label}</th>)}{workColumns.map(d=><th key={d.label} style={head}>{d.label}</th>)}</tr></thead>
            <tbody>{zones.map((z,i)=>{const area=z.area||z.room,cn=z.zoneCode||z.cn||'',dbRow=(payload?.rows||[]).find(r=>eq(r.floor,z.floor)&&eq(r.area,area));const bg=i%2?'#F3F1EA':'#fff';const boundary=i===0||zones[i-1].floor!==z.floor;const identity={...cell,background:bg,borderTop:boundary?`2px solid ${T.line}`:`1px solid ${T.line}`};
              const room=project.designExecutionBoard?.rooms?.find(r=>eq(r.flr||r.floor,z.floor)&&eq(r.area,area));
              return <tr key={JSON.stringify([z.floor,area])} style={{background:bg,borderTop:boundary?`2px solid ${T.line}`:undefined}}><td style={identity}>{z.floor}</td><td style={identity}>{cn}</td><td style={identity}>{area}</td>
              {receivedCols.map(([label,key])=><td key={key} style={{...cell,textAlign:'center'}}>{payload?<input type="checkbox" aria-label={`${z.floor} ${area} ${label} received`} checked={sheetDashboardFlag(dbRow?.[key])} disabled style={{accentColor:T.blue,opacity:1,width:12,height:12,margin:0,maxWidth:'100%'}}/>:'—'}</td>)}
              {workColumns.map(def=>{const result=liveWork(def,z,dbRow);return displayStatus(result.status,result.date,result.title,def.label);})}
</tr>;
            })}{!zones.length&&!loading&&<tr><td colSpan={3+receivedCols.length+workColumns.length} style={{...cell,padding:18}}>No floor/area rows for this project. Add them in Floor & Zone.</td></tr>}</tbody>
          </table>
        </div>

      </div>
      {showHours&&<aside id={`project-hours-${project.id}`} aria-label="Hours by Person" style={{border:`1px solid ${T.line}`,background:'#fff',position:'sticky',top:0,minWidth:0}}><div style={{padding:12,borderBottom:`1px solid ${T.line}`,background:'#FAF9F5'}}><div style={{fontFamily:FONT_MONO,fontSize:9,fontWeight:700,marginBottom:8,background:'#D2CDC1',color:'#1C1C19',padding:'9px 10px',borderBottom:`2px solid ${T.ink}`}}>HOURS BY PERSON</div>{personHours.map(([person,hours])=><div key={person} style={{display:'flex',justifyContent:'space-between',gap:12,fontFamily:FONT_BODY,fontSize:11,padding:'4px 0'}}><span>{person}</span><strong>{hours.toFixed(1)} h</strong></div>)}{!personHours.length&&<div style={{fontFamily:FONT_BODY,fontSize:11,color:T.inkDim}}>{loading?'Loading hours…':'No completed WIH hours yet.'}</div>}</div></aside>}

    </div>
  </div>;
}

function DesignFlowView({state,persist}){
  const [editId,setEditId]=useState(''),[projectDraft,setProjectDraft]=useState({}),[saving,setSaving]=useState(false),[error,setError]=useState('');
  const seen=new Set();
  const projects=(state.projects||[]).filter(p=>{
    if(p.completed||p.status==='Completed'||p.projectControl?.projectStatus==='Completed')return false;
    const id=String(p.id||p.no||p.name||'').toLowerCase();if(!id||seen.has(id))return false;seen.add(id);return true;
  });
  const canEditProject=id=>state.currentUser?.appAccess?.toLowerCase()!=='viewer'&&projectRole(state,id)==='Admin';
  const editing=projects.find(p=>String(p.id)===editId);
  const openEdit=p=>{setProjectDraft({no:p.no||p.projectNo||'',name:p.name||'',client:p.client||p.contacts?.Owner?.name||'',architect:p.architect||p.contacts?.Architect?.name||'',address:p.address||'',type:p.type||p.projectType||'Residence'});setEditId(String(p.id));setError('');};
  const saveProject=async()=>{
    if(!editing||saving)return;setSaving(true);setError('');
    try{
      const next={...editing,...projectDraft},saved=await projectApi.update(frontendProjectToBackend(next,true)),updated=backendProjectToFrontend(saved,next);
      await persist(latest=>({...latest,projects:(latest.projects||[]).map(p=>p.id===editing.id?{...p,...updated}:p)}));setEditId('');
    }catch(e){setError(e.message||'Could not save this project.');}finally{setSaving(false);}
  };
  return <div>
    <div style={{marginBottom:24}}><h2 style={{fontFamily:FONT_DISPLAY,margin:'0 0 6px'}}>Design Dashboard</h2><p style={{fontFamily:FONT_BODY,fontSize:13,color:T.inkDim,margin:0}}>{projects.length} ongoing projects · Scroll down to view each project’s drawing and work status.</p></div>
    {projects.map((p,index)=><section key={p.id} aria-label={`Design dashboard ${p.name}`} style={{paddingBottom:30,marginBottom:30,borderBottom:`2px solid ${T.line}`}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:14,flexWrap:'wrap',marginBottom:16}}><div><div style={{fontFamily:FONT_MONO,fontSize:10,color:T.cyan}}>PROJECT · {p.no||p.projectNo||''}</div><h2 style={{fontFamily:FONT_DISPLAY,margin:'4px 0',fontSize:23}}>{p.name}</h2></div>{canEditProject(p.id)&&<button type="button" onClick={()=>openEdit(p)} style={{...smallBtn,background:'#fff',padding:'9px 14px'}}>EDIT PROJECT</button>}</div>
      <DrawingControlDashboard state={state} projectId={p.id} deferLoad={index>0}/>
    </section>)}
    {projects.length>0&&<footer aria-label="Design dashboard status legend">
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12,fontFamily:FONT_MONO,fontSize:10}}>{['Pending','Open','Aligned','In-progress','Up for review','Completed'].map(status=><span key={status} style={{padding:'5px 8px',background:sheetDashboardTone(status).bg,color:sheetDashboardTone(status).fg}}>{status}</span>)}</div>
        <p style={{fontSize:11,color:T.inkDim}}>Receipt and sent checkboxes reflect saved drawing records. Update work through WIH and manage floors/areas in Floor & Zone.</p>
    </footer>}
    {!projects.length&&<p style={{fontFamily:FONT_BODY,color:T.inkDim}}>No ongoing projects available.</p>}
    {editing&&<div style={{position:'fixed',inset:0,zIndex:10001,background:'rgba(8,25,45,.55)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}><div role="dialog" aria-modal="true" aria-label={`Edit project ${editing.name}`} style={{width:'min(900px,96vw)',background:T.paper,border:`1px solid ${T.line}`}}>
      <div style={{background:T.navy,color:'#fff',padding:14,fontFamily:FONT_DISPLAY,fontSize:18}}>Edit Project · {editing.no}</div>
      <div style={{padding:16,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>{[['Project No.','no'],['Project Name','name'],['Client','client'],['Architect','architect'],['Address','address']].map(([label,key])=><Field key={key} label={label}><input aria-label={label} disabled={saving} value={projectDraft[key]||''} onChange={e=>setProjectDraft(d=>({...d,[key]:e.target.value}))} style={inputStyle}/></Field>)}<Field label="Project Type"><select disabled={saving} value={projectDraft.type||'Residence'} onChange={e=>setProjectDraft(d=>({...d,type:e.target.value}))} style={inputStyle}>{['Residence','Commercial','Hospitality','Retail','Other'].map(type=><option key={type}>{type}</option>)}</select></Field></div>
      {error&&<p role="alert" style={{color:T.redline,padding:'0 16px'}}>{error}</p>}
      <div style={{padding:16,borderTop:`1px solid ${T.line}`,display:'flex',justifyContent:'flex-end',gap:8}}><button type="button" disabled={saving} style={{...smallBtn,background:'#fff'}} onClick={()=>setEditId('')}>Cancel</button><Btn disabled={saving} onClick={saveProject}>{saving?'Saving…':'Save Project'}</Btn></div>
    </div></div>}
  </div>;
}
function ProjectInfoScopeMerged({state,persist,project}){
  if(!project)return <div style={{fontFamily:FONT_BODY,color:T.inkDim}}>Select a project.</div>;
  const scope=project.scope||{};
  const scopeFields=[
    ["Basement","basement"],["Stilt Floor","stiltFloor"],["GF","gf"],["1F","f1"],["2F","f2"],["3F","f3"],
    ["Terrace","terrace"],["Facade","facade"],["Landscape","landscape"],
    ["Bath Elevation","bathElevation"],["Furniture","wardrobe"],["Art Curation","art_curation"],["Onboarding","onboarding"]];
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
        ["Start Date",formatProjectDate(project.startDate)],
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
  const fields=[["Basement","basement"],["Stilt Floor","stiltFloor"],["GF","gf"],["1F","f1"],["2F","f2"],["3F","f3"],["Terrace","terrace"],["Facade","facade"],["Landscape","landscape"],["Bath Elev.","bathElevation"],["Furniture","wardrobe"],["Art Curation","art_curation"],["Onboarding","onboarding"]];
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

  const saveMeetingNotes=async meeting=>{
    try{const saved=await projectApi.saveProjectMeeting(meeting);await persist(latest=>({...latest,meetings:(latest.meetings||[]).map(m=>m.id===saved.id?{...m,active:true,updatedAt:saved.updatedAt}:m)}));alert('Meeting notes saved to Google Sheets.');}catch(e){alert(`Meeting notes could not be saved: ${e.message}`);}
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
          <Field label="Action Items"><textarea value={m.actionItems||""} onChange={e=>updateMeeting(m.id,{actionItems:e.target.value})} style={{...inputStyle,minHeight:78,borderRadius:0}} placeholder="Action · responsible person · due date"/></Field><button type="button" style={smallBtn} onClick={()=>saveMeetingNotes(m)}>Save MOM</button>
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
  const scopeSaveRequestsRef = useRef({});
  const completionPendingRef = useRef({});
  const editorSavePendingRef = useRef({});
  const [projectSaveMessage,setProjectSaveMessage] = useState("");
  const latestProjectStateRef = useRef(state);
  latestProjectStateRef.current = state;
  const [tab, setTab] = useState("list");
  const [selectedId, setSelectedId] = useState(state.projects[0]?.id || null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showExistingProjects, setShowExistingProjects] = useState(false);
  const [editProjectId, setEditProjectId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [isProjectEditorOpen, setIsProjectEditorOpen] = useState(false);
  const [showProjectTeam,setShowProjectTeam] = useState(false);
  const [teamRatingBusy,setTeamRatingBusy] = useState(false);
  const project = state.projects.find(p => p.id === selectedId) || state.projects[0];
  const [board, setBoard] = useState(null);

  useEffect(() => {
    setBoard(project?.designExecutionBoard || buildRoomCentricBoard(project));
  }, [project?.id]);


  const scopeFields = [
    ["Basement","basement"],["Stilt Floor","stilt_floor"],["GF","gf"],["1F","1f"],["2F","2f"],["3F","3f"],
    ["Terrace","terrace"],["Facade","facade"],["Landscape","landscape"],
    ["Bath Elevation","bath_elevation"],["Furniture","wardrobe"],["Art Curation","art_curation"],["Onboarding","onboarding"]];

  // Keep the scrollable table exactly as wide as its grid tracks, including Completed.
  const ongoingGridColumns = `65px 300px 180px 180px repeat(${scopeFields.length},78px) 105px`;
  const ongoingGridWidth = 65 + 300 + 180 + 180 + scopeFields.length * 78 + 105;

  const isCompletedProject = p => (p.status==="Completed" || p.projectControl?.projectStatus==="Completed" || Boolean(p.completedAt));
  const ongoingProjects = state.projects.filter(p=>!isCompletedProject(p));
  const completedProjects = state.projects.filter(isCompletedProject);
  const completeProject = async (p,e,outcome="survived") => {
    if(e)e.stopPropagation();
    if(completionPendingRef.current[p.id])return;
    completionPendingRef.current[p.id]=true;
    const previousSelection=selectedId;
    const now=new Date().toISOString();
    const before=latestProjectStateRef.current.projects.find(x=>x.id===p.id)||p;
    const statusFields=x=>({status:x.status,projectStatus:x.projectStatus,completed:x.completed,completedAt:x.completedAt,completedDate:x.completedDate,completionOutcome:x.completionOutcome});
    const applyStatus=async (fields,control)=>{
      const latest=latestProjectStateRef.current;
      const next={...latest,projects:latest.projects.map(x=>x.id===p.id?{...x,...fields,projectControl:{...x.projectControl,...control}}:x)};
      latestProjectStateRef.current=next;
      await persist(next);
    };
    // Update React state before waiting for Google Sheets.
    const localSave=applyStatus({status:"Completed",projectStatus:"Completed",completed:true,completedAt:now,completedDate:now.slice(0,10),completionOutcome:outcome},{projectStatus:"Completed",completedAt:now});
    if(selectedId===p.id){
      const next=latestProjectStateRef.current.projects.find(x=>!isCompletedProject(x));
      setSelectedId(next?.id||null);
    }
    // Finish any older scope write before completion, so it cannot reopen the project.
    clearTimeout(scopeSaveTimersRef.current[p.id]);
    delete scopeSaveTimersRef.current[p.id];
    const pendingScope=scopePendingRef.current[p.id];
    delete scopePendingRef.current[p.id];
    try {
      await localSave;
      await scopeSaveRequestsRef.current[p.id];
      if(pendingScope)await projectApi.update(frontendProjectToBackend(pendingScope.project,true));
      const completedRow=await projectApi.complete(p.id,outcome);
      const current=latestProjectStateRef.current.projects.find(x=>x.id===p.id);
      if(current){
        const synced=backendProjectToFrontend(completedRow,current);
        await applyStatus({...statusFields(synced),completionOutcome:outcome},{projectStatus:synced.projectControl?.projectStatus,completedAt:synced.projectControl?.completedAt});
      }
    } catch(err) {
      await applyStatus(statusFields(before),{projectStatus:before.projectControl?.projectStatus,completedAt:before.projectControl?.completedAt});
      if(previousSelection===p.id)setSelectedId(p.id);
      alert(`Project completion could not be saved. The previous status has been restored. ${err?.message||err}`);
    } finally {
      delete completionPendingRef.current[p.id];
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
      terrace:false,facade:false,wall_elevation:false,art_curation:false,landscape:false,bath_elevation:false,
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
        const request=projectApi.update(frontendProjectToBackend(pending.project, true));
        scopeSaveRequestsRef.current[p.id]=request.catch(()=>{});
        await request;
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
    const current = latestProjectStateRef.current.projects.find(p => p.id === editProjectId);
    if (!current || !editDraft || editorSavePendingRef.current[current.id]) return;
    const currentScope = scopeFor(current);
    const cleanContacts = {};
    Object.entries(editDraft.contacts || {}).forEach(([role, c]) => {
      if (c && (String(c.name || "").trim() || String(c.company || "").trim() || String(c.email || "").trim() || String(c.mobile || "").trim())) {
        cleanContacts[role] = {
          name: String(c.name || "").trim(),
          company: String(c.company || "").trim(),
          email: String(c.email || "").trim(),
          mobile: String(c.mobile || "").trim()
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
      scope: nextScope,
      projectControl:{...current.projectControl,projectStatus:editDraft.projectStatus},
      ...(editDraft.projectStatus!=="Completed"?{completed:false,completedAt:"",completedDate:""}:{})
    };
    const draftSnapshot=editDraft;
    const oldName=String(current.name||"").trim().toLowerCase();
    const latest=latestProjectStateRef.current;
    const allRows=latest.scopeSheet||PROJECT_SCOPE_SHEET_ROWS;
    const replaceScope=(rows,name,row)=>rows.some(r=>String(r.project||"").trim().toLowerCase()===name)
      ? rows.map(r=>String(r.project||"").trim().toLowerCase()===name?row:r):[...rows,row];
    const optimistic={...latest,projects:latest.projects.map(p=>p.id===current.id?nextProject:p),scopeSheet:replaceScope(allRows,oldName,nextScope)};
    editorSavePendingRef.current[current.id]=true;
    latestProjectStateRef.current=optimistic;
    const localSave=persist(optimistic);
    setIsProjectEditorOpen(false);
    setProjectSaveMessage("Changes applied · Saving to Google Sheets…");
    // Older scope writes must finish first; send one combined latest project snapshot.
    clearTimeout(scopeSaveTimersRef.current[current.id]);
    delete scopeSaveTimersRef.current[current.id];
    delete scopePendingRef.current[current.id];
    try {
      await localSave;
      await scopeSaveRequestsRef.current[current.id];
      await projectApi.update(frontendProjectToBackend(nextProject,true));
    } catch(err) {
      const latest=latestProjectStateRef.current;
      // Restore only fields still equal to this save, retaining later independent edits.
      const projects=latest.projects.map(p=>{
        if(p.id!==current.id)return p;
        const restored={...p};
        for(const key of Object.keys(nextProject)){
          if(JSON.stringify(p[key])===JSON.stringify(nextProject[key]))restored[key]=current[key];
        }
        return restored;
      });
      const scopeSheet=(latest.scopeSheet||[]).map(r=>JSON.stringify(r)===JSON.stringify(nextScope)?currentScope:r);
      const restored={...latest,projects,scopeSheet};
      latestProjectStateRef.current=restored;
      await persist(restored);
      setEditProjectId(current.id);setEditDraft(draftSnapshot);setIsProjectEditorOpen(true);
      setProjectSaveMessage(`Save failed. Your draft is retained; please retry. ${err?.message||err}`);
      delete editorSavePendingRef.current[current.id];
      return;
    }
    try {
      if(Object.keys(cleanContacts).length)await projectApi.saveContacts(current.id,contactsObjectToRows(nextProject,cleanContacts));
      setProjectSaveMessage("Saved to Google Sheets.");
    } catch(err) {
      setProjectSaveMessage(`Project saved, but contacts could not sync. Reopen the project and save again. ${err?.message||err}`);
    } finally {
      delete editorSavePendingRef.current[current.id];
    }
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
      <div style={{display:"flex",gap:8}}><button onClick={()=>{setShowExistingProjects(true);setShowNewProject(false);}} style={smallBtn}>Existing Projects</button>
      <button onClick={()=>{setShowNewProject(true);setShowExistingProjects(false);}} style={{...smallBtn,background:T.navy,color:"#fff",border:`1px solid ${T.navy}`,padding:"9px 13px",fontFamily:FONT_BODY,fontWeight:700,cursor:"pointer"}}>
        + New Project
      </button></div>
    </div>

    <PendingProjectCreations state={state} persist={persist}/>

    {(showNewProject || showExistingProjects) && <div style={{border:`1px solid ${T.line}`,background:"#fff",padding:16,marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontFamily:FONT_DISPLAY,fontSize:16,fontWeight:700}}>{showNewProject ? "New Project" : "Existing Projects"}</div>
        <button onClick={()=>{setShowNewProject(false);setShowExistingProjects(false);}} style={{...smallBtn}}>Close</button>
      </div>
      <ProjectOnboarding key={showNewProject ? "new" : "browse"} initialMode={showNewProject ? "new" : "browse"} state={state} persist={persist} selectedId={selectedId} setSelectedId={(id)=>{setSelectedId(id);setShowNewProject(false);setTab("list");}}/>
    </div>}

    <div style={{display:"flex",alignItems:"center",gap:0,borderBottom:`1px solid ${T.line}`,marginBottom:18,overflowX:"auto",background:"#fff"}}>
      {[["list","Projects & Scope"],["team","Directory"],["line","Line of Work"]].map(([id,label])=>
        <button type="button" key={id} onClick={(e)=>{e.preventDefault();e.stopPropagation();setTab(id);}} style={{
          padding:"11px 16px",border:"none",borderBottom:`3px solid ${tab===id?T.cyan:"transparent"}`,
          background:tab===id?T.navy:"transparent",color:tab===id?"#fff":T.inkDim,cursor:"pointer",
          fontFamily:FONT_BODY,fontSize:12,fontWeight:tab===id?700:500,whiteSpace:"nowrap"
        }}>{label}</button>
      )}
    </div>

    {projectSaveMessage&&<p role="status" style={{fontFamily:FONT_BODY,fontSize:12}}>{projectSaveMessage}</p>}
    {tab==="list" && <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,gap:10}}>
        <div style={{fontFamily:FONT_MONO,fontSize:10,letterSpacing:".1em",textTransform:"uppercase",color:T.inkDim}}>Ongoing Projects</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {project && !isCompletedProject(project) && <button type="button" onClick={()=>openProjectEditor(project)} style={{...smallBtn,border:`1px solid ${T.blue}`,color:T.blue,background:"#fff"}}>Edit Selected Project</button>}
          <div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim}}>{ongoingProjects.length} ongoing projects</div>
        </div>
      </div>

      <div style={{overflowX:"auto",border:`1px solid ${T.line}`,background:"#fff"}}>
        <div style={{width:ongoingGridWidth,minWidth:"100%"}}>
          <div style={{
            display:"grid",
            gridTemplateColumns:ongoingGridColumns,
            background:"#D2CDC1",color:"#1C1C19",borderBottom:`2px solid ${T.ink}`,
            fontFamily:FONT_MONO,fontSize:8,fontWeight:700
          }}>
            {["S. No","Current Project","Client","Architect",...scopeFields.map(([label])=>label),"Completed"].map((h,i)=>
              <div key={i} style={{padding:"9px 6px",borderRight:`1px solid ${T.line}`,textAlign:i>=4?"center":"left",display:"flex",alignItems:"center",justifyContent:i>=4?"center":"flex-start",background:"#D2CDC1",boxSizing:"border-box"}}>
                {h}
              </div>
            )}
          </div>

          {ongoingProjects.map((p,pi)=>{
            const sc=scopeFor(p);
            const selected=p.id===project?.id;
            return <div key={p.id} onClick={()=>setSelectedId(p.id)} style={{
              display:"grid",gridTemplateColumns:ongoingGridColumns,
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
              <div style={{display:"flex",gap:5,alignItems:"center",justifyContent:"center",padding:5,background:"#fff",borderRight:`1px solid ${T.line}`,boxSizing:"border-box"}}>
                <button type="button" onClick={e=>completeProject(p,e,"not_survived")} title="Completed — did not survive to the end" aria-label={`Mark ${p.name||"project"} completed, did not survive`} style={{...smallBtn,background:"#F5DEDC",color:"#963C37",border:"1px solid #C98D88",padding:"6px 9px",fontWeight:700}}>✕</button>
                <button type="button" onClick={e=>completeProject(p,e,"survived")} title="Completed — survived to the end" aria-label={`Mark ${p.name||"project"} completed, survived`} style={{...smallBtn,background:"#DFEDE0",color:"#2F7042",border:"1px solid #91B69A",padding:"6px 9px",fontWeight:700}}>✓</button>
              </div>
            </div>;
          })}
        </div>
      </div>

      {project&&<section aria-label="Project summary" style={{marginTop:16,border:`1px solid ${T.line}`,background:T.paper2,padding:16}}>
        <div style={{fontFamily:FONT_MONO,fontSize:10,color:T.cyan,marginBottom:12}}>PROJECT INFORMATION</div>
        <div style={{display:"flex",alignItems:"center",gap:18,flexWrap:"wrap"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,minmax(0,1fr))",gap:14,flex:"1 1 850px",minWidth:0}}>
          {[["Project No.",project.no],["Project Name",project.name],["Client",project.client||project.contacts?.Owner?.name],["Architect",project.architect||project.contacts?.Architect?.name],["Address",project.address],["Project Type",project.type]].map(([label,value])=><div key={label}><div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim,marginBottom:5}}>{label}</div><div style={{fontFamily:FONT_BODY,fontSize:13,overflowWrap:"anywhere"}}>{value||"—"}</div></div>)}
        </div>
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",flex:"0 0 90px"}}>
          <button type="button" style={{...smallBtn,border:`1px solid ${T.blue}`,color:T.blue,background:"#fff"}} onClick={()=>setShowProjectTeam(v=>!v)}>{showProjectTeam?"Hide Team":"View Team"}</button>
        </div>
        </div>
        {showProjectTeam&&<div style={{marginTop:14,borderTop:`1px solid ${T.line}`,paddingTop:14}}>
          <div style={{fontFamily:FONT_MONO,fontSize:11,fontWeight:700,marginBottom:10}}>PROJECT TEAM · {project.name}</div>
          <div style={{overflowX:"auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"minmax(160px,1.3fr) minmax(120px,1fr) minmax(190px,1.4fr) minmax(145px,auto)",gap:12,minWidth:680,padding:"8px",background:T.paper2,borderBottom:`1px solid ${T.ink}`,fontFamily:FONT_MONO,fontSize:10,fontWeight:700}}><span>TEAM MEMBER</span><span>MOBILE NUMBER</span><span>EMAIL ID</span><span>RATING</span></div>
          {Object.entries(project.contacts||{}).filter(([,c])=>c&&(String(c.name||"").trim()||String(c.company||"").trim())).map(([role,c])=>{
            const key=contactKey(c.name||c.company,c.mobile);
            const rating=Number(c.rating||state.ratings?.[key]?.rating||0);
            return <div key={role} style={{display:"grid",gridTemplateColumns:"minmax(160px,1.3fr) minmax(120px,1fr) minmax(190px,1.4fr) minmax(145px,auto)",alignItems:"center",gap:12,padding:"9px 8px",borderBottom:`1px solid ${T.line}`,minWidth:680}}>
              <div><strong style={{fontFamily:FONT_BODY,fontSize:13}}>{c.name||c.company}</strong><div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim}}>{contactRoleLabel(role)}{c.company?` · ${c.company}`:""}</div></div>
              <div style={{fontFamily:FONT_MONO,fontSize:12,overflowWrap:"anywhere"}}>{c.mobile||"—"}</div>
              <div style={{fontFamily:FONT_BODY,fontSize:12,overflowWrap:"anywhere"}}>{c.email||"—"}</div>
              <DirectoryStars name={c.name||c.company} value={rating} disabled={teamRatingBusy} onChange={async value=>{
                const before=latestProjectStateRef.current;
                const projects=directoryCorrections(before.projects,[key],{rating:value});
                const changed=projects.filter((p,i)=>p!==before.projects[i]);
                if(!changed.length)return;
                const next={...before,projects};setTeamRatingBusy(true);
                try{await persist(next);for(const p of changed)await projectApi.saveContacts(p.id,contactsObjectToRows(p,p.contacts));setProjectSaveMessage("Team rating saved to Google Sheets.");}
                catch(err){await persist(before);setProjectSaveMessage(`Team rating save failed: ${err?.message||err}`);}
                finally{setTeamRatingBusy(false);}
              }}/>
            </div>;
          })}
          {!Object.values(project.contacts||{}).some(c=>c&&(c.name||c.company))&&<div style={{fontFamily:FONT_BODY,fontSize:13,color:T.inkDim}}>No team contacts assigned to this project.</div>}
          </div>
        </div>}
      </section>}

      {project && editDraft && isProjectEditorOpen && <div style={{marginTop:16,border:`2px solid ${T.navy}`,background:"#fff",padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:14}}>
          <div>
            <div style={{fontFamily:FONT_MONO,fontSize:10,letterSpacing:".1em",textTransform:"uppercase",color:T.cyan}}>Project Details · Editable (Client & Architect read-only) / Contacts · Editable</div>
            <div style={{fontFamily:FONT_DISPLAY,fontSize:18,fontWeight:700,marginTop:3}}>{editDraft.name || "Selected Project"}</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            
            <button onClick={()=>setIsProjectEditorOpen(false)} style={{...smallBtn}}>Collapse</button>
          </div>
        </div>
        <section aria-label="Editable project details" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
          {[
            ["Project No.","no"],["Project Name","name"],["Client","client"],["Architect","architect"],
            ["Address","address"],["Project Type","type"],["Start Date","startDate"],
            ["Planned Completion","plannedCompletionDate"],["Project Status","projectStatus"]
          ].map(([label,key])=>{
            const locked=key==="client"||key==="architect";
            const value=editDraft[key]||"";
            return <div key={key}>
              <label style={{display:"block",fontFamily:FONT_MONO,fontSize:10,color:T.inkDim,marginBottom:5}}>{label}</label>
              {locked ? <div style={{fontFamily:FONT_BODY,fontSize:13,overflowWrap:"anywhere",padding:"9px 0"}}>{value||"—"}</div>
              : key==="type" ? <select aria-label={label} value={value} onChange={e=>setEditDraft(d=>({...d,[key]:e.target.value}))} style={{...inputStyle,width:"100%"}}>{["Residence","Commercial","Hospitality","Retail","Other"].map(v=><option key={v} value={v}>{v}</option>)}</select>
              : key==="projectStatus" ? <select aria-label={label} value={value} onChange={e=>setEditDraft(d=>({...d,[key]:e.target.value}))} style={{...inputStyle,width:"100%"}}>{["Ongoing","On Hold","Completed","Cancelled"].concat(value&&! ["Ongoing","On Hold","Completed","Cancelled"].includes(value)?[value]:[]).map(v=><option key={v} value={v}>{v}</option>)}</select>
              : <input aria-label={label} type={key==="startDate"||key==="plannedCompletionDate"?"date":"text"} value={value} onChange={e=>setEditDraft(d=>({...d,[key]:e.target.value}))} style={{...inputStyle,width:"100%",boxSizing:"border-box"}}/>}
            </div>;
          })}
        </section>
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
        <div style={{display:"flex",gap:8,marginTop:16}}>
          <Btn onClick={saveProjectEditor}><ClipboardCheck size={14}/> Save Project</Btn>
          <button type="button" style={{...smallBtn,border:"1px solid #9B3B35",color:"#9B3B35",background:"#fff"}} onClick={()=>deleteProject(project)}>Delete Project</button>
          
        </div>
        <div style={{fontFamily:FONT_BODY,fontSize:11,color:T.inkDim,marginTop:10}}>Edit Client and Architect in the contact list above. Save Project closes this editor and updates the summary immediately.</div>
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
            {completedProjects.map((p,i)=><div key={p.id} style={{display:"grid",gridTemplateColumns:"70px 1.5fr 1fr 1fr 130px",borderBottom:`1px solid ${T.line}`,fontFamily:FONT_BODY,fontSize:10,background:p.completionOutcome==="not_survived"?"#F7E8E6":"#EAF3EA"}}>
              <div style={{padding:8,borderRight:`1px solid ${T.line}`}}>{p.no||i+1}</div>
              <div style={{padding:8,borderRight:`1px solid ${T.line}`,fontWeight:700}}>{p.name}</div>
              <div style={{padding:8,borderRight:`1px solid ${T.line}`}}>{p.client||"—"}</div>
              <div style={{padding:8,borderRight:`1px solid ${T.line}`}}>{p.architect||"—"}</div>
              <div style={{padding:8,fontFamily:FONT_MONO}}>{formatProjectDate(p.completedDate||p.completedAt)}</div>
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
            <div style={{fontFamily:FONT_DISPLAY,fontSize:16,fontWeight:700,marginTop:5}}>{formatProjectDate(project.startDate||project.projectStartDate)}</div>
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

    {tab==="team"&&<ProjectDirectory state={state} persist={persist}/>}
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
        {rolesPresent.map((r) => <Chip key={r} active={roleFilter === r} onClick={() => setRoleFilter(r)}>{contactRoleLabel(r)}</Chip>)}
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
                  <span key={r} style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.inkDim, background: T.paperDim, padding: "2px 7px", borderRadius: 10 }}>{contactRoleLabel(r)}</span>
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
  const [meetingBusy,setMeetingBusy]=useState(false),[meetingError,setMeetingError]=useState('');
  const projectName=id=>state.projects.find(p=>p.id===id)?.name||"—";

  const saveMeeting=async meeting=>{
    if(meetingBusy)return false;setMeetingBusy(true);setMeetingError('');
    try{const saved=await projectApi.saveProjectMeeting(meeting);await persist(latest=>({...latest,meetings:[saved,...(latest.meetings||[]).filter(m=>m.id!==saved.id)]}));return true;}
    catch(e){setMeetingError(e.message);return false;}finally{setMeetingBusy(false);}
  };
  const addMeeting=async()=>{
    if(!form.title.trim()||!form.projectId)return;
    const saved=await saveMeeting({id:uid(),...form,title:form.title.trim()});
    if(saved)setForm(current=>({...current,title:'',agenda:'',participants:'',location:'',happened:false,nextDate:''}));
  };
  const updateMeeting=async(id,patch)=>{const meeting=(state.meetings||[]).find(m=>m.id===id);if(meeting)await saveMeeting({...meeting,...patch});};
  const removeMeeting=async id=>{
    const meeting=(state.meetings||[]).find(m=>m.id===id);if(!meeting||meetingBusy)return;
    setMeetingBusy(true);setMeetingError('');
    try{if(meeting.active===undefined)await projectApi.saveProjectMeeting(meeting);await projectApi.deleteProjectMeeting({id,projectId:meeting.projectId});await persist(latest=>({...latest,meetings:(latest.meetings||[]).filter(m=>m.id!==id)}));}catch(e){setMeetingError(e.message);}finally{setMeetingBusy(false);}
  };

  const refreshMeetings=async()=>{
    if(meetingBusy)return;setMeetingBusy(true);setMeetingError('');
    try{const workspace=await projectApi.getProjectWorkspace();const known=new Set(workspace.meetingIds||[]);await persist(latest=>({...latest,meetings:[...(workspace.meetings||[]),...(latest.meetings||[]).filter(m=>!known.has(m.id))]}));}catch(e){setMeetingError(e.message);}finally{setMeetingBusy(false);}
  };
  const nowKey=new Date().toISOString().slice(0,10);
  const meetings=[...(state.meetings||[])].sort((a,b)=>`${b.date||""} ${b.time||""}`.localeCompare(`${a.date||""} ${a.time||""}`));
  const upcoming=meetings.filter(m=>!m.happened&&(m.date||"")>=nowKey);
  const past=meetings.filter(m=>m.happened||(m.date||"")<nowKey);

  return <div>
    <div style={{marginBottom:18}}><button type="button" disabled={meetingBusy} onClick={refreshMeetings} style={{...smallBtn,float:'right'}}>Refresh meetings</button><h2 style={{fontFamily:FONT_DISPLAY,fontSize:20,margin:0,color:T.ink}}>Fix Meeting</h2><div style={{fontFamily:FONT_BODY,fontSize:13,color:T.inkDim,marginTop:4}}>Schedule meetings here. MOM is maintained in Execution Dashboard, but past MOM can be opened from this history.</div></div>

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
      {meetingError&&<p role="alert" style={{color:T.redline,fontFamily:FONT_BODY,fontSize:13}}>{meetingError}</p>}<Btn onClick={addMeeting} disabled={meetingBusy||!form.projectId||!form.title.trim()}><CalendarDays size={14}/> Fix Meeting</Btn>
    </div>

    <div style={{fontFamily:FONT_MONO,fontSize:10,fontWeight:700,letterSpacing:".08em",marginBottom:8}}>UPCOMING / SCHEDULED</div>
    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
      {upcoming.map(m=><div key={m.id} style={{background:"#fff",border:`1px solid ${T.line}`,padding:12}}>
        <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr auto auto",gap:10,alignItems:"center"}}>
          <div><strong style={{fontFamily:FONT_DISPLAY,fontSize:14}}>{m.title}</strong><div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim,marginTop:3}}>{projectName(m.projectId)} · {m.date} {m.time} · {m.location||"—"}</div></div>
          <div style={{fontFamily:FONT_BODY,fontSize:11,color:T.inkDim}}>{m.participants||"—"}</div>
          <button disabled={meetingBusy} onClick={()=>updateMeeting(m.id,{happened:true})} style={{...smallBtn}}>Mark Happened</button>
          <button disabled={meetingBusy} aria-label={`Cancel meeting ${m.title}`} onClick={()=>removeMeeting(m.id)} style={{border:"none",background:"transparent",cursor:"pointer"}}><X size={14} color={T.inkDim}/></button>
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


  useEffect(()=>{ setMembers(state.teamMaster || []); },[state.teamMaster]);
  useEffect(()=>{ setDepartments(state.departmentMaster || []); },[state.departmentMaster]);
  useEffect(()=>{ setDesignations(state.designationMaster || []); },[state.designationMaster]);


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
  const set = (k,v)=>setForm(f=>({...f,[k]:v}));
  return <div>
    <ProjectRoleManager state={state}/>
    <div style={{marginBottom:20}}><h2 style={{fontFamily:FONT_DISPLAY,fontSize:24,margin:"0 0 5px"}}>Team Master</h2><div style={{fontFamily:FONT_BODY,fontSize:13,color:T.inkDim}}>Enter each employee once. The Gmail ID is the login identity. Set <b>App Access = Admin</b> for administrators; User = project-wise Admin/User permissions assigned above + own WIH editing; Viewer = assigned projects and own WIH view only. App Access Admin is the system administrator; Project Admin is assigned separately for each project. Active team members automatically become selectable in Responsible Person / Assignee dropdowns.</div></div>
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
  { id: "drawingRegister", label: "Received / Sent", icon: FileText, group: "RECEIVED / SENT" },
  { id: "timesheet", label: "WIH Sheet", icon: Clock, group: "WIH SHEET" },
  { id: "meetings", label: "Fix Meeting", icon: CalendarDays, group: "WIH SHEET" },
  { id: "executionMain", label: "Execution Dashboard", icon: HardHat, group: "WIH SHEET" },
  { id: "site", label: "Site Punch-in", icon: MapPin, group: "SITE PUNCH-IN" },
  { id: "settings", label: "Team & Tasks", icon: Settings2, group: "ADMIN" },
];

function SidebarNavigation({items,view,onChange,pendingCount}){
  const groups=[...new Set(items.map(n=>n.group))];
  return <nav aria-label="Main navigation">{groups.map(group=>{
    const id='nav-'+group.replace(/[^a-z0-9]/gi,'-');
    return <section key={group}><div style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px 8px',fontFamily:FONT_MONO,fontSize:9,letterSpacing:'.1em',color:T.cyan,background:'transparent',border:0,textAlign:'left'}}><span>{group}{group==='RECEIVED / SENT'&&pendingCount>0?` (${pendingCount})`:''}</span></div><div id={id}>{items.filter(n=>n.group===group).map(n=>{const Icon=n.icon,active=view===n.id;return <button key={n.id} type="button" aria-current={active?'page':undefined} onClick={()=>onChange(n.id)} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'11px 20px',background:active?T.navy2:'transparent',border:0,borderLeft:`3px solid ${active?T.cyan:'transparent'}`,color:active?'#fff':'#B7C4D6',cursor:'pointer',fontFamily:FONT_BODY,fontSize:13,textAlign:'left'}}><Icon size={15}/><span style={{flex:1}}>{n.label}</span>{n.id==='classify'&&pendingCount>0&&<span style={{background:T.amber,color:'#fff',fontSize:10,padding:'1px 6px',borderRadius:10}}>{pendingCount}</span>}{active&&<ChevronRight size={13}/>}</button>;})}</div></section>;
  })}</nav>;
}

function projectNavigationItems(user){
  if(user?.appAccess?.toLowerCase()==='admin')return NAV;
  const ids=user?.appAccess?.toLowerCase()==='viewer'?['project','design','drawingRegister','timesheet','site']:['project','design','dashboard','upload','classify','drawingRegister','timesheet','meetings','site'];
  return NAV.filter(n=>ids.includes(n.id));
}

function StudioApp() {
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
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: ".12em", color: T.cyan }}>STUDIO TRACKER · ACCOUNT ACCESS</div>
          <h2 style={{ fontFamily: FONT_DISPLAY, margin: "8px 0 8px", color: T.ink }}>Account access required</h2>
          <div style={{ color: T.inkDim, fontSize: 13, lineHeight: 1.6 }}>{backendErr || "Your Google account is not registered or does not have access."}</div>
          {currentUser?.email && <div style={{ marginTop: 14, padding: 12, background: T.paperDim, border: `1px solid ${T.line}`, fontFamily: FONT_MONO, fontSize: 12 }}>{currentUser.email}</div>}
          <div style={{ marginTop: 16, fontSize: 12, color: T.inkDim }}>Add this Gmail ID in <b>Team & Tasks → Team Master</b> and set the appropriate <b>App Access</b> and <b>Status = Active</b>.</div>
        </div>
      </div>
    );
  }

  const isAdmin=currentUser?.appAccess?.toLowerCase()==="admin";
  const allowedNav=projectNavigationItems(currentUser);
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
        <SidebarNavigation items={allowedNav} view={view} onChange={setView} pendingCount={pendingCount}/>
        <div style={{ padding: "20px", marginTop: 20, fontFamily: FONT_MONO, fontSize: 10, color: T.cyan, opacity: 0.7 }}>
          <div style={{ marginBottom: 6 }}>{currentUser?.appAccess} · {currentUser?.name || ""}</div>
          <div style={{ opacity: 0.7, wordBreak: "break-all" }}>{currentUser?.email || ""}</div>
          <div style={{ marginTop: 10, opacity: 0.6 }}>enLIGHTen OS · project → scope → team → line of work → WIH</div>
        </div>
      </div>

      {/* Main canvas */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TitleBlock view={viewLabel} sub={view === "timesheet" ? `${state.tasks.length} tasks` : view === "classify" ? `${pendingCount} pending` : view === "project" ? "Onboarding · Scope · Team · Line of Work" : view === "meetings" ? `${(state.meetings || []).length} meetings` : view === "executionMain" ? "Milestones · MOM" : view === "site" ? `${(state.siteVisits || []).length} site visits` : undefined} />
        {view!=='upload'&&(state.pendingReceivedUploads||[]).length>0&&<div role="status" style={{padding:'8px 24px',fontFamily:FONT_BODY,fontSize:12,background:T.amberBg,color:T.ink}}>{state.pendingReceivedUploads.length} drawing upload(s) pending. <button type="button" style={smallBtn} onClick={()=>setView('upload')}>View uploads</button></div>}
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
          {view === "project" && (isAdmin?<ProjectView state={state} persist={persist} />:<ProjectPermissionsView state={state} persist={persist}/>)}
          {isAdmin && view === "designLineOfWork" && <DesignLineOfWorkView state={state} persist={persist} />}
          {allowedNav.some(n=>n.id==="design") && view === "design" && <DesignFlowView state={state} persist={persist} />}
          
          {allowedNav.some(n=>n.id==="dashboard") && view === "dashboard" && <DashboardView state={state} persist={persist} />}
          {allowedNav.some(n=>n.id==="drawingRegister") && view === "drawingRegister" && <ReceivedSentView state={state}/>}
          {allowedNav.some(n=>n.id==="upload") && view === "upload" && <UploadView state={state} persist={persist} />}
          {allowedNav.some(n=>n.id==="classify") && view === "classify" && <ClassifyView state={state} persist={persist} />}
          {view === "timesheet" && <TimesheetView state={state} persist={persist} />}
          {allowedNav.some(n=>n.id==="meetings") && view === "meetings" && <MeetingsView state={state} persist={persist} />}
          {isAdmin && view === "executionMain" && <ExecutionMainView state={state} persist={persist} />}
          {allowedNav.some(n=>n.id==="site") && view === "site" && <ProjectPunchInsView state={state}/>}
          {isAdmin && view === "settings" && <SettingsView state={state} persist={persist} />}
        </div>
      </div>
    </div>
  );
}

function MemberProjectsView({state}) {
  const projects=state.projects||[];
  const [selected,setSelected]=useState(projects[0]?.id||'');
  const [tab,setTab]=useState('scope');
  const p=projects.find(p=>String(p.id)===String(selected))||projects[0];
  if(!p)return <div>No projects available.</div>;
  const workflow=p.lineOfWorkResidence||p.lineOfWork||[];
  return <div>
    <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginBottom:18}}><div><h2 style={{fontFamily:FONT_DISPLAY,margin:0}}>Projects</h2><div style={{fontSize:12,color:T.inkDim,marginTop:6}}>View only · Project information, contacts and planned work</div></div><select aria-label="View project" style={{...inputStyle,minWidth:260}} value={p.id} onChange={e=>setSelected(e.target.value)}>{projects.map(x=><option key={x.id} value={x.id}>{x.no} · {x.name}</option>)}</select></div>
    <div style={{display:'flex',gap:8,marginBottom:16}}>{[['scope','Projects & Scope'],['team','Teams & Ratings'],['line','Line of Work']].map(([id,label])=><Btn key={id} variant={tab===id?'dark':'ghost'} onClick={()=>setTab(id)}>{label}</Btn>)}</div>
    {tab==='scope'&&<><table style={{borderCollapse:'collapse',width:'100%'}}><tbody>{[['Project',p.name],['Number',p.no],['Client',p.client||p.contacts?.Owner?.name],['Architect',p.architect||p.contacts?.Architect?.name],['Address',p.address],['Type',p.type],['Status',p.status],['Start',formatProjectDate(p.startDate)],['End',p.endDate]].map(([label,value])=><tr key={label}><td style={{...tdStyle,textAlign:'left',width:170,color:T.inkDim}}>{label}</td><td style={{...tdStyle,textAlign:'left'}}>{String(value??'—')}</td></tr>)}</tbody></table><div style={{marginTop:18,fontFamily:FONT_BODY,fontSize:13}}><strong>Project scope</strong><div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:10}}>{Object.entries(p.scope||{}).filter(([,v])=>v===true).map(([k])=><span key={k} style={{background:T.paperDim,padding:'7px 10px'}}>{k.replace(/_/g,' ')}</span>)}</div></div></>}
    {tab==='team'&&<>{ROLE_CATEGORIES.map(({category,roles})=>{const entries=roles.filter(r=>p.contacts?.[r]);return entries.length?<div key={category} style={{marginBottom:20}}><div style={{fontFamily:FONT_MONO,color:categoryColor(category),marginBottom:8}}>{contactRoleLabel(category)}</div><table style={{width:'100%',borderCollapse:'collapse'}}><tbody>{entries.map(r=><tr key={r}>{[contactRoleLabel(r),p.contacts[r].name,p.contacts[r].company,p.contacts[r].email,p.contacts[r].mobile].map((v,i)=><td key={i} style={{...tdStyle,textAlign:'left'}}>{String(v??'—')||'—'}</td>)}</tr>)}</tbody></table></div>:null;})}</>}
    {tab==='line'&&<>{workflowGroups(workflow.filter(r=>String(r.workflowVersion)==='1')).map(g=><details key={g.first.lineWorkId||g.first.id} open style={{border:`1px solid ${T.line}`,marginBottom:12}}><summary style={{padding:12,background:T.paperDim}}><strong>{g.first.milestone}</strong> · {g.first.tasks}</summary><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Step','Subtask','Responsible','Estimated hours'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead><tbody>{g.rows.map((r,i)=><tr key={r.lineWorkId||r.id}><td style={tdStyle}>{i+1}</td><td style={tdStyle}>{r.subtask}</td><td style={tdStyle}>{r.responsible||'Unassigned'}</td><td style={tdStyle}>{r.hours||'—'}</td></tr>)}</tbody></table></details>)}{!workflow.some(r=>String(r.workflowVersion)==='1')&&<div style={{color:T.inkDim}}>The admin has not saved the detailed workflow for this project.</div>}</>}
  </div>;
}

function projectRole(state,id){
  const u=state.currentUser;
  if(u?.appAccess?.toLowerCase()==='admin')return 'Admin';
  if(u?.appAccess?.toLowerCase()==='viewer')return u.projectRoles?.[id]?'User':'';
  return u?.projectRoles?.[id]||'';
}
function memberProjectRoleMap(rows,userId){
  const roles={};
  rows.filter(r=>String(r.userId)===String(userId)&&(r.active===true||String(r.active).toLowerCase()==='true')&&['Admin','User'].includes(r.projectRole)).forEach(r=>{const id=String(r.projectId);roles[id]=roles[id]&&roles[id]!==r.projectRole?'User':roles[id]||r.projectRole;});
  return roles;
}
function ProjectRoleManager({state}){
  const [rows,setRows]=useState([]),[userId,setUserId]=useState(''),[drafts,setDrafts]=useState({}),[search,setSearch]=useState('');
  const [loading,setLoading]=useState(true),[loadError,setLoadError]=useState(''),[busy,setBusy]=useState(false),[feedback,setFeedback]=useState({});
  const pendingRef=useRef(false);
  const reload=async()=>{setLoading(true);setLoadError('');try{setRows(await projectApi.listProjectRoles());}catch(e){setLoadError(e.message||'Could not load project access.');}finally{setLoading(false);}};
  useEffect(()=>{let live=true;projectApi.listProjectRoles().then(list=>{if(live)setRows(list);}).catch(e=>{if(live)setLoadError(e.message||'Could not load project access.');}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[]);
  const members=state.teamMaster||[],member=members.find(m=>String(m.userId)===userId);
  const active=member&&member.active!==false&&String(member.active).toLowerCase()!=='false';
  const saved=memberProjectRoleMap(rows,userId),draft=drafts[userId]||saved;
  const projects=[...(state.projects||[])];
  Object.keys(saved).filter(id=>!projects.some(p=>String(p.id)===id)).forEach(id=>projects.push({id,name:'Saved project '+id,status:'Archived / unavailable'}));
  const changes=[...new Set([...Object.keys(saved),...Object.keys(draft)])].filter(id=>(saved[id]||'')!==(draft[id]||'')).map(projectId=>({projectId,projectRole:draft[projectId]||''}));
  const setRole=(projectId,role)=>{setDrafts(all=>({...all,[userId]:{...(all[userId]||memberProjectRoleMap(rows,userId)),[projectId]:role}}));setFeedback({});};
  const save=async()=>{
    if(!userId||!changes.length||pendingRef.current)return;pendingRef.current=true;setBusy(true);setFeedback({});
    const personId=userId;
    try{const result=await projectApi.saveMemberProjectRoles({userId:personId,changes});setRows(previous=>[...previous.filter(r=>String(r.userId)!==personId),...result.roles]);setDrafts(all=>{const next={...all};delete next[personId];return next;});setFeedback({userId:personId,text:'Project access saved. This person should reload the app to see changes.'});}
    catch(e){setFeedback({userId:personId,error:true,text:e.message||'Could not save project access. Your selections are retained.'});}
    finally{pendingRef.current=false;setBusy(false);}
  };
  const filtered=projects.filter(p=>`${p.no||''} ${p.name||''}`.toLowerCase().includes(search.toLowerCase()));
  const assigned=Object.values(draft).filter(Boolean),adminCount=assigned.filter(r=>r==='Admin').length;
  return <section style={{border:`1px solid ${T.line}`,background:'#fff',padding:18,marginBottom:24,fontFamily:FONT_BODY,fontSize:13}}>
    <h2 style={{fontFamily:FONT_DISPLAY,marginTop:0}}>People & Project Access</h2>
    <p style={{color:T.inkDim,lineHeight:1.5}}>Open a person’s record, then assign their projects and choose Admin or User for each one.</p>
    <Field label="Person"><select aria-label="Access person" disabled={busy} value={userId} onChange={e=>{setUserId(e.target.value);setSearch('');setFeedback({});}} style={inputStyle}><option value="">Select a person…</option>{members.map(m=><option key={m.userId} value={m.userId}>{m.name} · {m.userId}{m.active===false||String(m.active).toLowerCase()==='false'?' · Inactive':''}</option>)}</select></Field>
    {loading&&<p role="status" style={{color:T.inkDim}}>Loading project access…</p>}
    {feedback.text&&(!feedback.userId||feedback.userId===userId)&&<p role={feedback.error?'alert':'status'} style={{color:feedback.error?T.redline:T.green,lineHeight:1.5}}>{feedback.text}</p>}
    {loadError&&<div role="alert" style={{color:T.redline,marginBottom:14}}>{loadError} <button type="button" style={smallBtn} onClick={reload}>Retry loading access</button></div>}
    {member&&!loading&&!loadError&&<>
      <div style={{padding:14,background:T.paperDim,marginBottom:16,border:`1px solid ${T.line}`}}><strong style={{fontFamily:FONT_DISPLAY,fontSize:17}}>{member.name}</strong><div style={{color:T.inkDim,marginTop:5}}>{[member.email,member.role,member.department].filter(Boolean).join(' · ')}</div><div style={{marginTop:8}}>{assigned.length} projects assigned · {adminCount} Admin · {assigned.length-adminCount} User</div>
        {String(member.appAccess).toLowerCase()==='admin'&&<p style={{margin:'10px 0 0',color:T.inkDim}}>This person is a System Admin and already has access to every project. Set App Access to User in Team Master to apply project-specific limits.</p>}
        {!active&&<p style={{margin:'10px 0 0',color:T.redline}}>This account is inactive. You can remove assignments; activate the person before granting new access.</p>}
        {String(member.appAccess).toLowerCase()==='viewer'&&<p style={{margin:'10px 0 0',color:T.inkDim}}>This account is a Viewer. Project assignments remain view only until App Access is changed to User.</p>}
        {String(member.appAccess).toLowerCase()==='no access'&&<p style={{margin:'10px 0 0',color:T.inkDim}}>This account has No Access. Set App Access to User in Team Master so they can sign in to assigned projects.</p>}
      </div>
      <input aria-label="Search access projects" placeholder="Find a project…" value={search} onChange={e=>setSearch(e.target.value)} style={{...inputStyle,marginBottom:12}}/>
      <div style={{overflowX:'auto',maxHeight:470,overflowY:'auto',border:`1px solid ${T.line}`}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:510}}><thead><tr>{['Assign','Project','Project role'].map(h=><th key={h} style={{...thStyle,background:T.paperDim,color:T.ink,textAlign:'left',position:'sticky',top:0,zIndex:1}}>{h}</th>)}</tr></thead><tbody>{filtered.map(p=>{const id=String(p.id),role=draft[id]||'';return <tr key={id}><td style={{...tdStyle,textAlign:'left',width:70}}><input type="checkbox" aria-label={`Assign ${p.name}`} checked={!!role} disabled={busy||(!active&&!saved[id])} onChange={e=>setRole(id,e.target.checked?(saved[id]||'User'):'')}/></td><td style={{...tdStyle,textAlign:'left'}}><strong>{p.no?`${p.no} · `:''}{p.name}</strong><div style={{fontSize:11,color:T.inkDim,marginTop:3}}>{p.completed||p.status==='Completed'?'Completed':p.status||'Ongoing'}</div></td><td style={{...tdStyle,textAlign:'left',width:180}}><select aria-label={`Role for ${p.name}`} disabled={busy||!role||!active} value={role||'User'} onChange={e=>setRole(id,e.target.value)} style={{...inputStyle,fontSize:12,padding:'8px 10px'}}><option value="User">User</option><option value="Admin">Admin</option></select>{!role&&<span style={{display:'block',fontSize:11,color:T.inkDim,marginTop:4}}>Not assigned</span>}</td></tr>;})}</tbody></table>{!filtered.length&&<p style={{padding:14,color:T.inkDim}}>No matching projects.</p>}</div>
      <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginTop:16}}><Btn disabled={busy||!changes.length} onClick={save}>{busy?'Saving project access…':'Save project access'}</Btn><button type="button" disabled={busy||!changes.length} style={smallBtn} onClick={()=>{setDrafts(all=>{const next={...all};delete next[userId];return next;});setFeedback({});}}>Discard changes</button><span style={{color:T.inkDim,fontSize:12}}>{changes.length?`${changes.length} project changes pending`:'All changes saved'}</span></div>
    </>}
  </section>;
}
function ProjectPermissionsView({state,persist}){
  const [selected,setSelected]=useState(state.projects[0]?.id||''),[tab,setTab]=useState('scope');
  const p=state.projects.find(x=>String(x.id)===String(selected))||state.projects[0];
  if(!p)return <p>No assigned projects. Ask your system Admin to assign a project role in Team & Tasks.</p>;
  const role=projectRole(state,p.id),admin=role==='Admin';
  const scoped={...state,projects:[p]};
  const saveScoped=async update=>persist(latest=>{
    const scope={...latest,projects:latest.projects.filter(x=>x.id===p.id)};
    const next=typeof update==='function'?update(scope):update;
    return {...latest,projects:latest.projects.map(x=>x.id===p.id?(next.projects.find(n=>n.id===p.id)||x):x)};
  });
  return <div><h2>Projects</h2><select aria-label="Assigned project" style={inputStyle} value={p.id} onChange={e=>{setSelected(e.target.value);setTab('scope');}}>{state.projects.map(x=><option key={x.id} value={x.id}>{x.no} · {x.name}</option>)}</select><p>Project role: <b>{contactRoleLabel(role)}</b> · {admin?'Manage this project':'View only'}</p><div style={{display:'flex',gap:8,marginBottom:18}}>{[['scope','Projects & Scope'],['line','Line of Work'],['floor','Floor & Zone'],['site','Site Punch-in']].map(([id,label])=><Btn key={id} onClick={()=>setTab(id)} variant={tab===id?'dark':'ghost'}>{label}</Btn>)}</div>
  {tab==='scope'&&(admin?<ProjectScopeAdmin key={p.id} project={p} onSaved={async row=>saveScoped({...scoped,projects:[backendProjectToFrontend(row,p)]})}/>:<MemberProjectsView key={p.id} state={scoped}/>)}
  {tab==='line'&&(admin?<ProjectLineOfWorkView key={p.id} state={scoped} persist={saveScoped} selectedId={p.id}/>:<ReadOnlyProjectWork state={state} project={p}/>)}
  {tab==='floor'&&((state.currentUser.appAccess.toLowerCase()!=='viewer')?<DashboardView key={p.id} state={scoped} persist={saveScoped}/>:<table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Zone','Floor','Area'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead><tbody>{(p.floorZones||[]).map((r,i)=><tr key={r.floorZoneId||i}>{[r.zoneCode,r.floor,r.area].map((v,j)=><td key={j} style={tdStyle}>{v}</td>)}</tr>)}</tbody></table>)}
  {tab==='site'&&<ProjectPunchInsView key={p.id} state={scoped}/>}
  </div>;
}
function ReadOnlyProjectWork({project,state}){
  const rows=project.lineOfWorkResidence||project.lineOfWork||[];
  return <><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Milestone','Task','Subtask','Responsible','Hours'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.lineWorkId||r.id||i}>{[r.milestone,r.tasks||r.title,r.subtask,r.responsible||r.assignee,r.hours].map((v,j)=><td key={j} style={tdStyle}>{v||'—'}</td>)}</tr>)}</tbody></table><ProjectGantt state={state} projectId={project.id}/></>;
}
function ProjectScopeAdmin({project,onSaved}){
  const [draft,setDraft]=useState(project),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const save=async()=>{setBusy(true);try{const row=await projectApi.update(frontendProjectToBackend(draft,true));await onSaved(row);setMessage('Saved to Google Sheets.');}catch(e){setMessage(e.message);}finally{setBusy(false);}};
  const fields=[['Basement','basement'],['Stilt Floor','stilt_floor'],['GF','gf'],['1F','1f'],['2F','2f'],['3F','3f'],['Terrace','terrace'],['Facade','facade'],['Landscape','landscape'],['Bath Elevation','bath_elevation'],['Furniture','wardrobe'],['Art Curation','art_curation'],['Onboarding','onboarding']];
  return <section><h3>{project.name} · Scope & Status</h3><Field label="Project status"><select style={inputStyle} value={draft.status} onChange={e=>setDraft(d=>({...d,status:e.target.value,projectStatus:e.target.value,projectControl:{...d.projectControl,projectStatus:e.target.value}}))}><option>Ongoing</option><option>On Hold</option><option>Completed</option></select></Field><div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:16}}>{fields.map(([label,k])=><label key={k}><input type="checkbox" checked={!!draft.scope?.[k]} onChange={e=>setDraft(d=>({...d,scope:{...d.scope,[k]:e.target.checked}}))}/> {label}</label>)}</div><Btn disabled={busy} onClick={save}>{busy?'Saving…':'Save Scope & Status'}</Btn><p role="status">{message}</p></section>;
}
function ProjectPunchInsView({state}){
  const [projectId,setProjectId]=useState(state.projects[0]?.id||''),[rows,setRows]=useState([]),[draft,setDraft]=useState(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  const admin=projectRole(state,projectId)==='Admin'&&state.currentUser?.appAccess?.toLowerCase()!=='viewer';
  const canPunch=!!projectRole(state,projectId)&&state.currentUser?.appAccess?.toLowerCase()!=='viewer';
  useEffect(()=>{let active=true;setRows([]);setDraft(null);setMessage('');if(projectId)projectApi.listSitePunchIns(projectId).then(r=>{if(active)setRows(r);}).catch(e=>{if(active)setMessage(e.message);});return()=>{active=false;};},[projectId]);
  const save=async()=>{setBusy(true);try{const payload={...draft,projectId,checkInAt:draft.checkInAt?new Date(draft.checkInAt).toISOString():'',checkOutAt:draft.checkOutAt?new Date(draft.checkOutAt).toISOString():''};await projectApi.saveSitePunchIn(payload);setRows(await projectApi.listSitePunchIns(projectId));setDraft(null);setMessage('Punch-in saved to Google Sheets.');}catch(e){setMessage(e.message);}finally{setBusy(false);}};
  const edit=r=>{const localDate=iso=>{if(!iso)return '';const d=new Date(iso);if(isNaN(d))return '';return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};setDraft({punchId:r.punchId,userId:r.userId,purpose:r.purpose||'',checkInAt:localDate(r.checkInAt),checkOutAt:localDate(r.checkOutAt)});};
  const remove=async r=>{if(!window.confirm('Delete this punch-in record?'))return;setBusy(true);try{await projectApi.deleteSitePunchIn({projectId,punchId:r.punchId});setRows(await projectApi.listSitePunchIns(projectId));}catch(e){setMessage(e.message);}finally{setBusy(false);}};
  return <section><h2>Site Punch-in Records</h2><select aria-label="Punch-in project" value={projectId} style={inputStyle} onChange={e=>setProjectId(e.target.value)}>{state.projects.map(p=><option key={p.id} value={p.id}>{p.no} · {p.name}</option>)}</select><p>{admin?'Project Admin · manage records and dates':canPunch?'Add or update your own records · only Admin can delete':'View only'}</p>{canPunch&&<Btn disabled={!projectId||busy} onClick={()=>setDraft({userId:state.currentUser.userId,purpose:'',checkInAt:'',checkOutAt:''})}>Add Punch-in Record</Btn>}
  {canPunch&&draft&&<div style={{border:`1px solid ${T.line}`,padding:16,marginTop:14}}><Field label="Team member"><select style={inputStyle} value={draft.userId} onChange={e=>setDraft(d=>({...d,userId:e.target.value}))}>{(state.teamMaster||[]).filter(m=>admin||m.userId===state.currentUser.userId).map(m=><option key={m.userId} value={m.userId}>{m.name}</option>)}</select></Field>{[['checkInAt','Entry date & time'],['checkOutAt','Exit date & time (optional)']].map(([k,label])=><Field key={k} label={label}><input type="datetime-local" style={inputStyle} value={draft[k]} onChange={e=>setDraft(d=>({...d,[k]:e.target.value}))}/></Field>)}<Field label="Purpose"><input style={inputStyle} value={draft.purpose} onChange={e=>setDraft(d=>({...d,purpose:e.target.value}))}/></Field><Btn disabled={busy||!draft.checkInAt||!draft.userId} onClick={save}>Save Punch-in</Btn><button style={smallBtn} onClick={()=>setDraft(null)}>Cancel</button></div>}
  <p role="status">{message}</p><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Member','Entry','Exit','Purpose',...(canPunch?['Actions']:[])].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.punchId}><td style={tdStyle}>{r.person}</td><td style={tdStyle}>{r.checkInAt?new Date(r.checkInAt).toLocaleString('en-IN'):'—'}</td><td style={tdStyle}>{r.checkOutAt?new Date(r.checkOutAt).toLocaleString('en-IN'):'—'}</td><td style={tdStyle}>{r.purpose}</td>{canPunch&&<td style={tdStyle}>{(admin||r.userId===state.currentUser.userId)&&<button disabled={busy} style={smallBtn} onClick={()=>edit(r)}>Edit Dates</button>}{admin&&<button disabled={busy} style={smallBtn} onClick={()=>remove(r)}>Delete</button>}</td>}</tr>)}</tbody></table>{!rows.length&&<p>No punch-in records.</p>}</section>;
}


function StageActivationPanel({state,project,row,disabled,onActivated,onActivationState}){
  const [reference,setReference]=useState('');
  const [selection,setSelection]=useState({scope:'',excluded:[]});
  const [confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const zones=project.floorZones||[];
  const key=z=>JSON.stringify([z.floor,z.area]);
  const scope=JSON.stringify([project.id,row.lineWorkId]);
  const excluded=selection.scope===scope?selection.excluded:[];
  const chosen=zones.filter(z=>!excluded.includes(key(z)));
  const toggleAreas=(areas,checked)=>setSelection(current=>{
    const previous=current.scope===scope?current.excluded:[],targets=new Set(areas.map(key));
    return {scope,excluded:checked?previous.filter(k=>!targets.has(k)):[...new Set([...previous,...targets])]};
  });
  const floorGroups=[...zones.reduce((groups,z)=>{const floor=String(z.floor||'Unspecified floor');if(!groups.has(floor))groups.set(floor,[]);groups.get(floor).push(z);return groups;},new Map())];
  const floorRank=f=>{const value=f.trim().toLowerCase();if(['basement','b1'].includes(value))return -1;if(['stilt','stilt floor','sf'].includes(value))return -.5;if(['gf','ground floor','ground'].includes(value))return 0;const numeric=/^(-?\d+)\s*f$/.exec(value);if(numeric)return Number(numeric[1]);return value==='terrace'?1000:2000;};
  floorGroups.sort((a,b)=>floorRank(a[0])-floorRank(b[0]));
  const [activationError,setActivationError]=useState(false);
  const activate=async()=>{
    setBusy(true);setMessage('');setActivationError(false);onActivationState?.('Activating…');
    let task;
    try{task=await projectApi.queueWorkflowTask({projectId:project.id,lineWorkId:row.lineWorkId,coverage:chosen.map(z=>({floor:z.floor,area:z.area})),milestoneConfirmed:confirmed,activationReference:reference});}
    catch(e){
      const drawingsMissing=/classify|required drawing/i.test(e.message);
      setActivationError(true);setMessage(`Activation was not saved. ${e.message}`);
      onActivationState?.(drawingsMissing?'Blocked · drawings required':'Activation failed');setBusy(false);
      if(drawingsMissing)alert('Please upload and classify the drawing for the selected areas before activating.');
      return;
    }
    onActivationState?.('Activated · awaiting parent start');
    setMessage('Stage activated. Start its parent task in WIH to open the ordered subtasks.');
    try{await onActivated(task);}catch(e){setMessage(e.message||'Activation saved. Refresh to see the latest status.');}finally{setBusy(false);}
  };
  const guidance={fontFamily:FONT_BODY,fontSize:13,fontWeight:400,lineHeight:1.5,color:T.inkDim,margin:'10px 0'};
  return <div style={{padding:12,border:`1px solid ${T.line}`,marginBottom:12,fontFamily:FONT_BODY,fontSize:13,fontWeight:400,lineHeight:1.5,color:T.ink}}>
    <Field label="Drawing package / revision reference (optional)"><input disabled={disabled||busy} style={inputStyle} value={reference} onChange={e=>setReference(e.target.value)}/></Field>
    <p style={guidance}><strong style={{fontWeight:600,color:T.ink}}>Starting milestone:</strong> {row.startingMilestone||'Confirm prerequisite'}</p>
    <p style={guidance}>All areas are selected by default and grouped by floor. Use “Select entire floor” to include or exclude a complete floor, or choose individual areas. Meetings are shared within this activation; design steps repeat for each selected floor / area.</p>
    <div style={{display:'grid',gap:12,margin:'12px 0'}}>{floorGroups.map(([floor,areas])=>{
      const selected=areas.filter(z=>!excluded.includes(key(z))).length,all=selected===areas.length,mixed=selected>0&&!all;
      return <fieldset key={floor} style={{margin:0,padding:'12px 14px',border:`1px solid ${T.line}`,minWidth:0}}>
        <legend style={{fontFamily:FONT_BODY,fontSize:13,fontWeight:600,color:T.ink,padding:'0 6px'}}>{floor}</legend>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',paddingBottom:10,marginBottom:10,borderBottom:`1px solid ${T.line}`}}>
          <label style={{display:'inline-flex',alignItems:'center',gap:7,fontFamily:FONT_BODY,fontSize:13,fontWeight:500,color:T.ink}}><input type="checkbox" aria-label={`Select entire ${floor} floor`} aria-checked={mixed?'mixed':all} ref={node=>{if(node)node.indeterminate=mixed;}} disabled={disabled||busy} checked={all} onChange={e=>toggleAreas(areas,e.target.checked)}/> Select entire floor</label>
          <span style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim}}>{selected} of {areas.length} areas selected</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,220px),1fr))',gap:'10px 16px'}}>{areas.map((z,i)=><label key={z.floorZoneId||i} style={{...guidance,display:'flex',gap:7,alignItems:'flex-start',margin:0}}><input type="checkbox" aria-label={`${floor} · ${z.area}${z.zoneCode?' · '+z.zoneCode:''}`} disabled={disabled||busy} checked={!excluded.includes(key(z))} onChange={e=>toggleAreas([z],e.target.checked)} style={{marginTop:3,flexShrink:0}}/><span>{z.area}{z.zoneCode&&<span style={{color:T.inkDim,fontSize:11,marginLeft:6}}>({z.zoneCode})</span>}</span></label>)}</div>
      </fieldset>;
    })}</div>
    {!zones.length&&<p style={guidance}>Add floors and zones before activating a stage.</p>}
    <label style={{...guidance,display:'flex',alignItems:'center',gap:6,margin:'12px 0'}}><input type="checkbox" disabled={disabled||busy} checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/> Starting milestone and required approvals are satisfied</label>
    <Btn disabled={disabled||busy||!confirmed||!chosen.length} onClick={activate}>{busy?'Activating…':'Activate selected floors / areas'}</Btn>
    {message&&<p role={activationError?"alert":"status"} style={{...guidance,color:activationError?T.red:T.inkDim,fontWeight:activationError?500:400}}>{message}</p>}
  </div>;
}
function ProjectGantt({state,projectId}){
  const [rows,setRows]=useState([]),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[editor,setEditor]=useState(null),[rangeStart,setRangeStart]=useState(new Date().toISOString().slice(0,10)),[days,setDays]=useState(90),[floor,setFloor]=useState('All');
  const admin=projectRole(state,projectId)==='Admin';
  useEffect(()=>{let active=true;setRows([]);setEditor(null);setMessage('');projectApi.getProjectWorkflowTasks(projectId).then(r=>{if(active){setRows(r);const starts=r.map(t=>t.plannedStartDate).filter(Boolean).sort();if(starts.length)setRangeStart(starts[0]);}}).catch(e=>{if(active)setMessage(e.message);});return()=>{active=false;};},[projectId]);
  const refresh=async()=>{setBusy(true);try{setRows(await projectApi.getProjectWorkflowTasks(projectId));}catch(e){setMessage(e.message);}finally{setBusy(false);}};
  const save=async()=>{setBusy(true);try{await projectApi.updateWorkflowSchedule({projectId,designTaskId:editor.designTaskId,plannedStartDate:editor.plannedStartDate||'',plannedCompletionDate:editor.plannedCompletionDate||'',meetingChannel:editor.meetingChannel||'In person',meetingLink:editor.meetingLink||''});setRows(await projectApi.getProjectWorkflowTasks(projectId));setEditor(null);setMessage('Schedule saved. WIH completion updates actual progress.');}catch(e){setMessage(e.message);}finally{setBusy(false);}};
  const day=24*60*60*1000,start=new Date(rangeStart+'T00:00:00Z').getTime(),width=days*22;
  const list=rows.filter(r=>floor==='All'||!r.floor||r.floor===floor).sort((a,b)=>String(a.parentTask||a.milestone).localeCompare(String(b.parentTask||b.milestone))||Number(a.subtaskOrder)-Number(b.subtaskOrder)||String(a.floor).localeCompare(String(b.floor))||String(a.area).localeCompare(String(b.area)));
  const offset=d=>Math.floor((new Date(String(d).slice(0,10)+'T00:00:00Z').getTime()-start)/day);
  const bar=(from,to,color,top)=>{if(!from)return null;const x=offset(from),end=offset(to||from);if(!Number.isFinite(x)||end<0||x>=days)return null;const left=Math.max(0,x),right=Math.min(days,end+1);return <div title={`${from} → ${to||from}`} style={{position:'absolute',left:left*22,width:Math.max(4,(right-left)*22),top,height:9,background:color,border:'1px solid #26374a'}}/>;};
  return <section style={{marginTop:20}}><h3>Floor-wise Gantt</h3><p>Pink: in-person meeting · Purple: phone/Zoom permitted · White: floor-wise design task. Bars: planned dates; lower green/navy bar: actual work. Unscheduled tasks have no invented dates.</p><div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:12}}><label>From <input aria-label="Gantt start" type="date" value={rangeStart} onChange={e=>setRangeStart(e.target.value||new Date().toISOString().slice(0,10))}/></label><select aria-label="Gantt horizon" value={days} onChange={e=>setDays(Number(e.target.value))}>{[30,90,180,365].map(n=><option key={n} value={n}>{n} days</option>)}</select><select aria-label="Gantt floor" value={floor} onChange={e=>setFloor(e.target.value)}><option>All</option>{[...new Set(rows.map(r=>r.floor).filter(Boolean))].map(f=><option key={f}>{f}</option>)}</select><Btn disabled={busy} variant="ghost" onClick={refresh}>Refresh Gantt</Btn></div><p role="status">{message}</p>
  {admin&&editor&&<div style={{padding:16,border:`1px solid ${T.line}`,marginBottom:14}}><h4>{editor.taskType} · {editor.floor||'Shared meeting'} {editor.area}</h4>{[['plannedStartDate','Planned start'],['plannedCompletionDate','Planned finish']].map(([k,label])=><Field key={k} label={label}><input type="date" style={inputStyle} value={editor[k]||''} onChange={e=>setEditor(x=>({...x,[k]:e.target.value}))}/></Field>)}{editor.taskCategory==='Meeting'&&<><Field label="Meeting channel"><select style={inputStyle} value={editor.meetingChannel||'In person'} onChange={e=>setEditor(x=>({...x,meetingChannel:e.target.value}))}><option>In person</option>{editor.meetingMode==='Phone / Zoom allowed'&&<><option>Phone</option><option>Zoom</option></>}</select></Field><Field label="Meeting link (optional)"><input style={inputStyle} value={editor.meetingLink||''} onChange={e=>setEditor(x=>({...x,meetingLink:e.target.value}))}/></Field></>}<Btn disabled={busy} onClick={save}>Save Schedule</Btn><button style={smallBtn} onClick={()=>setEditor(null)}>Cancel</button></div>}
  <div style={{overflowX:'auto',border:`1px solid ${T.line}`}}><div style={{minWidth:width+440}}><div style={{display:'flex',background:T.paperDim,height:32}}><div style={{width:440,flexShrink:0,padding:7}}>Task · Floor / Area · Status</div><div style={{position:'relative',width}}>{Array.from({length:Math.ceil(days/7)},(_,i)=><span key={i} style={{position:'absolute',left:i*154,fontSize:10}}>{new Date(start+i*7*day).toISOString().slice(5,10)}</span>)}</div></div>{list.map(r=>{const meeting=r.taskCategory==='Meeting',color=meeting?(r.meetingMode==='Phone / Zoom allowed'?'#B4A5D7':'#D7A5BF'):'#fff';return <div key={r.designTaskId} style={{display:'flex',borderTop:`1px solid ${T.line}`,minHeight:64}}><div style={{width:440,flexShrink:0,padding:7,background:color,fontSize:11}}><b>{r.taskType}</b><div>{r.parentTask||r.milestone} · {r.floor||'Project meeting'} {r.area} · {r.actualStatus||r.status}</div><div>{r.assigneeName||'Unassigned'}{!r.plannedStartDate&&' · Unscheduled'} {meeting&&(r.meetingChannel||r.meetingMode)} {r.meetingLink&&<a href={r.meetingLink} target="_blank" rel="noreferrer">Meeting link</a>} {admin&&<button style={smallBtn} onClick={()=>setEditor({...r})}>Schedule</button>}</div></div><div style={{position:'relative',width,background:'repeating-linear-gradient(to right,#fff 0px,#fff 21px,#e8e8e8 21px,#e8e8e8 22px)'}}>{bar(r.plannedStartDate,r.plannedCompletionDate,color,12)}{bar(r.startedAt,r.completedAt||new Date().toISOString(),r.status==='Completed'?T.green:T.navy,32)}</div></div>;})}{!rows.length&&<p style={{padding:16}}>No activated subtasks yet. Save the PDF flow, activate a stage, then start its parent task in WIH.</p>}</div></div></section>;
}

let AUTH_ID_TOKEN='';
let AUTH_SESSION_GENERATION=0;
function clearStudioCaches(){try{for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&/enlighten/i.test(k))localStorage.removeItem(k);}}catch(_){}}
export default function App(){
  const [signedIn,setSignedIn]=useState(false);
  const [config,setConfig]=useState(null);
  const [error,setError]=useState('');
  const [checking,setChecking]=useState(true);
  const [signingIn,setSigningIn]=useState(false);
  const buttonRef=useRef(null),attemptRef=useRef(0),signingInRef=useRef(false);
  const enter=()=>{AUTH_ID_TOKEN='';AUTH_SESSION_GENERATION++;clearStudioCaches();setError('');setSignedIn(true);};
  const signOut=async()=>{
    if(signingInRef.current)return;
    setChecking(true);setError('');attemptRef.current++;
    try{
      const response=await fetch('/api',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'authSignOut'})});
      const result=await response.json();if(!response.ok||!result.ok)throw Error(result.error?.message||'Could not sign out. Please retry.');
      AUTH_ID_TOKEN='';AUTH_SESSION_GENERATION++;clearStudioCaches();setSignedIn(false);window.google?.accounts?.id?.disableAutoSelect();
    }catch(e){setError(e.message||'Could not sign out. Check your connection and retry.');}
    finally{setChecking(false);}
  };
  useEffect(()=>{
    let active=true;
    const expired=()=>{attemptRef.current++;AUTH_ID_TOKEN='';AUTH_SESSION_GENERATION++;clearStudioCaches();setSignedIn(false);setChecking(false);setError('Your session has ended. Sign in again to continue.');};
    window.addEventListener('enlighten-auth-expired',expired);
    Promise.all([fetch('/api?action=authConfig',{credentials:'same-origin'}).then(r=>r.json()),fetch('/api?action=authSession',{credentials:'same-origin'}).then(r=>r.json())]).then(([configuration,session])=>{
      if(!active)return;
      if(!configuration.data?.clientId)throw Error('Admin setup required: configure GOOGLE_CLIENT_ID in Vercel.');
      setConfig(configuration.data);
      if(!session.ok)throw Error(session.error?.message||'Could not check sign-in. Refresh to retry.');
      if(session.data?.signedIn)enter();
    }).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setChecking(false);});
    return()=>{active=false;window.removeEventListener('enlighten-auth-expired',expired);};
  },[]);
  useEffect(()=>{
    if(!config||signedIn||checking)return;
    let active=true;
    const renderButton=()=>{
      if(!active||!buttonRef.current)return;
      window.google.accounts.id.initialize({client_id:config.clientId,auto_select:false,callback:async response=>{
        if(!active||!response.credential||signingInRef.current)return;
        const attempt=++attemptRef.current;signingInRef.current=true;setSigningIn(true);setError('');
        try{
          const reply=await fetch('/api',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'text/plain;charset=utf-8',Authorization:`Bearer ${response.credential}`},body:JSON.stringify({action:'authSession'})});
          const result=await reply.json();if(!reply.ok||!result.ok||!result.data?.signedIn)throw Error(result.error?.message||'Could not complete sign-in. Please retry.');
          if(active&&attempt===attemptRef.current)enter();
        }catch(e){if(active&&attempt===attemptRef.current)setError(e.message||'Could not complete sign-in. Please retry.');}
        finally{signingInRef.current=false;if(active)setSigningIn(false);}
      }});
      window.google.accounts.id.renderButton(buttonRef.current,{type:'standard',theme:'outline',size:'medium',shape:'pill',text:'signin_with',logo_alignment:'left'});
    };
    if(window.google?.accounts?.id){renderButton();return()=>{active=false;};}
    let script=document.getElementById('enlighten-google-login');if(!script){script=document.createElement('script');script.id='enlighten-google-login';script.src='https://accounts.google.com/gsi/client';script.async=true;document.head.appendChild(script);}
    script.addEventListener('load',renderButton);const failed=()=>{if(active)setError('Google sign-in could not load. Check your connection.');};script.addEventListener('error',failed);
    return()=>{active=false;script.removeEventListener('load',renderButton);script.removeEventListener('error',failed);};
  },[config,signedIn,checking]);
  if(signedIn)return <><div style={{background:T.navy,color:'#fff',padding:'8px 18px',display:'flex',justifyContent:'flex-end',alignItems:'center',gap:12,fontFamily:FONT_BODY,fontSize:12}}>{error&&<span role="alert">{error}</span>}<button disabled={checking} onClick={signOut} style={{...smallBtn,background:'#fff'}}>{checking?'Signing out…':'Sign out / switch account'}</button></div><StudioApp/></>;
  return <main className="enlighten-landing" aria-label="enLIGHTen sign in">
    <section className="enlighten-landing__center" aria-label="Welcome to enLIGHTen">
      <img className="enlighten-landing__logo" src="/enlighten-wordmark.svg" alt="enLIGHTen" width="710" height="140" />
      <div className="enlighten-landing__signin">
        <div className="enlighten-landing__google" ref={buttonRef}/>
        {(checking||signingIn||(!config&&!error))&&<p className="enlighten-landing__hint" role="status">{signingIn?'Signing in…':checking?'Checking sign-in…':'Loading sign-in…'}</p>}
        {error&&<p className="enlighten-landing__error" role="alert">{error}</p>}
      </div>
    </section>
    <p className="enlighten-landing__footer"><span>SENSING SPACES - EVOKING EMOTIONS</span><span>ARCHITECTURE, REIMAGINED</span></p>
  </main>;
}
