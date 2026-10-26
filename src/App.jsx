import './TechnicalTable.css';
import {TECH_COLUMNS,parseCadOutput,buildTechnicalTable} from './technical-engine.js';
import './WorkflowOverview.css';
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
import QRCode from 'qrcode';
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Upload, ClipboardCheck, LayoutGrid, Users, Clock, Plus, X, CheckCircle2, Circle, Timer, FileUp, ChevronRight, Settings2, AlertTriangle, Loader2, Building2, CalendarDays, MapPin, LogIn, LogOut, Navigation, FileText, HardHat, ChevronDown, FolderOpen
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

const PORTAL_PACKAGES=['General','Electrical','POP','Furniture','Kitchen','Stone'];
function DrawingPortalAccess({contact,state,onClose}){
  const [rows,setRows]=useState([]),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[qr,setQr]=useState('');
  const link=window.location.origin+window.location.pathname+'#drawings';
  useEffect(()=>{let live=true;setBusy(true);projectApi.getDirectoryDrawingAccess(contact.email).then(r=>{if(live)setRows(r);}).catch(e=>{if(live)setMessage(e.message);}).finally(()=>{if(live)setBusy(false);});QRCode.toDataURL(link,{width:220,margin:2,color:{dark:'#0B1D33',light:'#FFFFFF'}}).then(src=>{if(live)setQr(src);}).catch(()=>{if(live)setMessage('QR could not be generated. Use the portal link below.');});return()=>{live=false;};},[contact.email]);
  const patch=(id,changes)=>setRows(list=>list.map(r=>r.contactId===id?{...r,...changes}:r));
  const save=async()=>{setBusy(true);setMessage('');try{for(const row of rows)await projectApi.saveDirectoryDrawingAccess(row);setMessage('Drawing access saved.');}catch(e){setMessage(e.message);}finally{setBusy(false);}};
  return <div role="dialog" aria-modal="true" aria-label="Directory drawing access" style={{position:'fixed',inset:0,zIndex:15500,background:'rgba(8,25,45,.45)',display:'flex',justifyContent:'flex-end'}}><div style={{width:600,maxWidth:'100%',height:'100%',overflowY:'auto',background:T.paper,padding:22,fontFamily:FONT_BODY}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><h3 style={{fontFamily:FONT_DISPLAY}}>Drawing access · {contact.name||contact.company}</h3><button type="button" disabled={busy} style={smallBtn} onClick={onClose}>Close</button></div><p style={{fontSize:12}}>{contact.email}</p><p style={{fontSize:12,color:T.inkDim}}>Sign in with this Google email to see assigned projects and issued packages. CAD is locked until enabled below.</p>{busy&&<p role="status">Loading / saving…</p>}{message&&<p role="status" style={{fontSize:12}}>{message}</p>}{rows.map(row=><section key={row.contactId} style={{padding:14,background:'#fff',border:`1px solid ${T.line}`,marginBottom:12}}><strong style={{fontSize:13}}>{state.projects.find(p=>p.id===row.projectId)?.name||row.projectId}</strong><p style={{fontSize:12,color:T.inkDim,margin:'4px 0 12px'}}>{contactRoleLabel(row.role)}</p><label style={{fontSize:12,display:'block',marginBottom:10}}><input type="checkbox" disabled={busy} checked={row.enabled} onChange={e=>patch(row.contactId,{enabled:e.target.checked})}/> Portal enabled</label><div style={{display:'flex',gap:12,flexWrap:'wrap',fontSize:12}}>{['All',...PORTAL_PACKAGES].map(pack=><label key={pack}><input type="checkbox" disabled={busy} checked={row.packages.includes(pack)} onChange={e=>patch(row.contactId,{packages:e.target.checked?[...row.packages,pack]:row.packages.filter(p=>p!==pack)})}/> {pack==='All'?'All packages':pack}</label>)}</div><label style={{display:'block',fontSize:12,marginTop:12}}><input type="checkbox" disabled={busy} checked={row.allowCad} onChange={e=>patch(row.contactId,{allowCad:e.target.checked})}/> Allow CAD downloads for these packages</label></section>)}{!rows.length&&!busy&&<p>No saved directory assignments available to manage. Save the contact email and project assignment first.</p>}<button type="button" style={smallBtn} disabled={busy||!rows.length} onClick={save}>Save drawing access</button><section style={{marginTop:24,borderTop:`1px solid ${T.line}`,paddingTop:16}}><h4>Drawing portal QR</h4>{qr&&<img src={qr} alt="QR code for drawing portal" width={220} height={220}/>}<p style={{fontSize:12,color:T.inkDim}}>The QR opens the download portal. Google sign-in and package permissions still apply.</p><input aria-label="Drawing portal link" readOnly value={link} style={inputStyle}/>{qr&&<a download="drawing-portal-qr.png" href={qr} style={{...smallBtn,display:'inline-block',marginTop:12}}>Download QR</a>}</section></div></div>;
}
function workDrawingDetails(task,fileName){
  const raw=task.task||task;let coverage=[];try{coverage=JSON.parse(task.workflowCoverage||raw.workflowCoverage||'[]');}catch{}
  const source=[fileName,task.drawingCode,raw.drawingCode,task.taskType,raw.taskType,task.title,raw.parentTask].filter(Boolean);let drawingCode='';
  for(const value of source){const text=String(value).toUpperCase().replace(/FLRCIR?/g,'FLR / CIR'),codes=[];for(const [code,re] of [['ZONES',/\bZONES?\b|\bZONING\b/],['RCP',/\bRCP\b/],['FLR',/\bFLR\b/],['CIR',/\bCIR\b|\bCIRCUIT\b/],['IRF',/\bIRF?\b/],['DETAIL',/\bDETAIL\b/]])if(re.test(text))codes.push(code);if(codes.length){drawingCode=codes.join(' / ');break;}}
  return {drawingCode:drawingCode||task.taskType||raw.taskType||task.title||'Drawing',drawingFloor:task.floor||raw.floor||[...new Set(coverage.map(r=>r.floor).filter(Boolean))].join(', ')||'Project',drawingArea:task.area||raw.area||[...new Set(coverage.map(r=>r.area).filter(Boolean))].join(', ')||'All areas'};
}
function IssueDrawingForm({file,projectId,onIssued}){
  const id=useRef(uid()),[packages,setPackages]=useState([]),[context,setContext]=useState(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[message,setMessage]=useState('');
  useEffect(()=>{let live=true;setLoading(true);setContext(null);setMessage('');projectApi.getIssueDrawingContext({projectId,driveFileId:file.id}).then(data=>{if(live)setContext(data);}).catch(e=>{if(live)setMessage(e.message);}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[projectId,file.id]);
  const publish=async()=>{setBusy(true);setMessage('');try{const result=await projectApi.publishPortalDrawing({projectId,driveFileId:file.id,issueId:id.current,packages});setMessage(`Issued ${result.revision||context.revision}. Drawing saved in Sent.`);onIssued?.();}catch(e){setMessage(e.message);}finally{setBusy(false);}};
  if(!['PDF','DWG','DXF','DWT','DWF'].includes(drawingFileType({fileName:file.name})))return null;
  return <section aria-label="Issue drawing packages" style={{marginTop:20,borderTop:`1px solid ${T.line}`,paddingTop:14}}><h4 style={{fontFamily:FONT_DISPLAY,fontSize:14,margin:'0 0 10px'}}>Issue drawing</h4>{loading&&<p role="status" style={{fontSize:11,color:T.inkDim}}>Reading Work in Hand drawing details…</p>}{context&&<><p style={{fontFamily:FONT_BODY,fontSize:11,color:T.inkDim,lineHeight:1.6,margin:'0 0 14px'}}>{context.drawingCode} · {context.floor} · {context.area}<br/>{context.alreadyIssued?'Issued revision':'Next revision'} {context.revision}</p><div style={{display:'grid',gap:8,fontFamily:FONT_BODY,fontSize:12}}>{PORTAL_PACKAGES.map(pack=><label key={pack}><input type="checkbox" disabled={busy} checked={packages.includes(pack)} onChange={e=>setPackages(values=>e.target.checked?[...values,pack]:values.filter(p=>p!==pack))}/> {pack} package</label>)}</div><button type="button" style={{...smallBtn,marginTop:14}} disabled={busy||!packages.length} onClick={publish}>{busy?'Issuing…':'Issue'}</button></>}{message&&<p role="status" style={{fontSize:12,lineHeight:1.5}}>{message}</p>}</section>;
}

async function downloadPortalDrawing(issueId,onProgress){
  const first=await projectApi.getPortalDrawingChunk({issueId,offset:0}),parts=[first];let next=first.nextOffset;onProgress?.(Math.round(next/first.total*100));
  while(next<first.total){const starts=[next];if(next+768*1024<first.total)starts.push(next+768*1024);const chunks=await Promise.all(starts.map(offset=>projectApi.getPortalDrawingChunk({issueId,offset})));for(const chunk of chunks){if(chunk.offset!==next||chunk.total!==first.total)throw Error('Drawing changed during download. Retry.');parts.push(chunk);next=chunk.nextOffset;}onProgress?.(Math.round(next/first.total*100));}
  const bytes=parts.map(part=>Uint8Array.from(atob(part.data),c=>c.charCodeAt(0))),url=URL.createObjectURL(new Blob(bytes,{type:first.mimeType})),a=document.createElement('a');a.href=url;a.download=first.fileName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function ContractorDrawingPortal({user}){
  const [data,setData]=useState(null),[projectId,setProjectId]=useState(''),[pack,setPack]=useState('All'),[error,setError]=useState(''),[busy,setBusy]=useState(false),[revision,setRevision]=useState(0),[progress,setProgress]=useState(null);
  useEffect(()=>{let live=true;setBusy(true);setError('');projectApi.getDrawingPortal().then(r=>{if(live){setData(r);setProjectId(id=>r.projects.some(p=>p.id===id)?id:r.projects[0]?.id||'');}}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setBusy(false);});return()=>{live=false;};},[revision]);
  const visible=(data?.drawings||[]).filter(r=>r.projectId===projectId&&(pack==='All'||r.packages.includes(pack))),groups=new Map();for(const row of visible){const key=JSON.stringify([row.drawingCode,row.floor,row.area]);if(!groups.has(key))groups.set(key,{code:row.drawingCode,floor:row.floor,area:row.area,rows:[]});groups.get(key).rows.push(row);}const revisions=[...new Set(visible.map(r=>r.revision))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})),packages=[...new Set((data?.drawings||[]).filter(r=>r.projectId===projectId).flatMap(r=>r.packages))];
  const download=async row=>{setError('');setProgress({id:row.issueId,percent:0});try{await downloadPortalDrawing(row.issueId,percent=>setProgress({id:row.issueId,percent}));}catch(e){setError(e.message);}finally{setProgress(null);}};
  const cell={...tdStyle,fontFamily:FONT_BODY,fontSize:12,textAlign:'left',verticalAlign:'top',border:`1px solid ${T.line}`,padding:12};
  return <main style={{minHeight:'80vh',background:T.paper,color:T.ink,padding:24,fontFamily:FONT_BODY}}><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap"/><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><div><h2 style={{fontFamily:FONT_DISPLAY,margin:'0 0 6px'}}>Issued Drawings</h2><p style={{fontSize:12,color:T.inkDim,margin:0}}>{user.name} · {user.email}</p></div><button type="button" style={smallBtn} disabled={busy} onClick={()=>setRevision(n=>n+1)}>Refresh drawings</button></div>{busy&&<p role="status">Loading issued drawings…</p>}{error&&<p role="alert" style={{color:T.redline,fontSize:12}}>{error}</p>}{progress&&<p role="status" style={{fontSize:12}}>Preparing download · {progress.percent}%</p>}<div style={{display:'flex',gap:8,flexWrap:'wrap',margin:'22px 0'}}>{data?.projects.map(p=><button key={p.id} type="button" style={{...smallBtn,background:projectId===p.id?T.navy:'#fff',color:projectId===p.id?'#fff':T.blue}} onClick={()=>{setProjectId(p.id);setPack('All');}}>{p.no} · {p.name}</button>)}</div><div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>{['All',...packages].map(name=><button key={name} type="button" style={{...smallBtn,background:pack===name?'#E6EEF4':'#fff'}} onClick={()=>setPack(name)}>{name==='All'?'All issued packages':name+' package'}</button>)}</div><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={{...thStyle,background:'#D2CDC1',textAlign:'left'}}>Drawing / Floor / Area</th>{revisions.map(r=><th key={r} style={{...thStyle,background:'#D2CDC1',textAlign:'left'}}>{r}</th>)}</tr></thead><tbody>{[...groups.values()].map(g=><tr key={JSON.stringify([g.code,g.floor,g.area])}><td style={cell}><strong>{g.code}</strong><div style={{marginTop:4,color:T.inkDim}}>{g.floor} {g.area}</div></td>{revisions.map(rev=><td key={rev} style={cell}>{g.rows.filter(r=>r.revision===rev).map(row=><div key={row.issueId} style={{marginBottom:12}}><div style={{fontSize:11,marginBottom:5,overflowWrap:'anywhere'}}>{row.fileName}</div><button type="button" disabled={!row.canDownload||!!progress} style={{...smallBtn,opacity:row.canDownload?1:.55}} onClick={()=>download(row)}>{row.format==='CAD'&&!row.canDownload?'CAD · Locked':'Download '+row.format}</button><div style={{fontSize:10,color:T.inkDim,marginTop:5}}>Published {formatProjectDate(row.issuedDate)}</div></div>)}</td>)}</tr>)}{!visible.length&&!busy&&<tr><td style={cell} colSpan={1+revisions.length}>No issued drawings in this selection yet.</td></tr>}</tbody></table></div>{!data?.projects.length&&!busy&&<p style={{fontSize:12,color:T.inkDim}}>No active directory project assignments. Ask your project contact to check your email and drawing access.</p>}</main>;
}

function ProjectDirectory({state,persist}){
  const [portalContact,setPortalContact]=useState(null);
  const [query,setQuery]=useState("");
  const [role,setRole]=useState("All");
  const [editor,setEditor]=useState(null);
  const [mergeQuery,setMergeQuery]=useState("");
  const [projectQuery,setProjectQuery]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const pendingRef=useRef(false),latestRef=useRef(state);latestRef.current=state;
  const directory=buildDirectory(state.projects,state.ratings||{});
  const roles=[...new Set([...ROLES,"Interior Designer",...directory.flatMap(d=>d.roles)])].filter(role=>!["Principal Lighting Designer","Lighting Designer","Lighting Engineer","Process Coordinator","Owner","Client","Site Incharge","Accounts Incharge"].includes(role));
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

    </div>
    <div role="group" aria-label="Directory role filters" style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>{['All',...roles].map(r=><button key={r} type="button" aria-pressed={role===r} onClick={()=>setRole(r)} style={{...smallBtn,padding:'7px 10px',background:role===r?T.navy:'#fff',color:role===r?'#fff':T.blue,borderColor:role===r?T.navy:T.blue}}>{contactRoleLabel(r)}</button>)}</div>
    {message&&<p role="status" style={{fontSize:12}}>{message}</p>}
    <div style={{overflowX:"auto"}}><table style={{borderCollapse:"collapse",width:"100%",minWidth:1140,tableLayout:"fixed",border:`1px solid ${T.line}`,fontFamily:FONT_BODY}}><colgroup>{[14,15,15,32,13,11].map((w,i)=><col key={i} style={{width:`${w}%`}}/>)}</colgroup><thead><tr>{["Name","Company / Studio","Role","Projects","Rating","Actions"].map(h=><th key={h} style={{...thStyle,background:"#D2CDC1",color:"#1C1C19",fontFamily:FONT_MONO,textAlign:"left",fontSize:10,padding:"12px",borderRight:`1px solid ${T.line}`,borderBottom:`2px solid ${T.ink}`}}>{h}</th>)}</tr></thead><tbody>{visible.map(d=><tr key={d.key}>
      <td style={cell}><strong>{d.name||"—"}</strong><div style={{fontSize:12,color:T.inkDim}}>{d.mobile}</div></td><td style={cell}>{d.company||"—"}</td><td style={cell}>{d.roles.map(r=><div key={r}>{contactRoleLabel(r)}</div>)}</td>
      <td style={{...cell,padding:0}}><div style={{maxHeight:220,overflowY:"auto"}}>{d.projects.filter(p=>role==="All"||Object.entries(state.projects.find(x=>x.id===p.id)?.contacts||{}).some(([r,c])=>r===role&&c&&contactKey(c.name||c.company,c.mobile)===d.key)).map((p,i)=><div key={p.id} style={{padding:"9px 12px",borderTop:i?`1px solid ${T.line}`:"none",textAlign:"left"}}>{p.no&&<span style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim,marginRight:8}}>{p.no}</span>}{p.name||p.id}<div style={{fontSize:11,color:T.inkDim,marginTop:3}}>{Object.entries(state.projects.find(x=>x.id===p.id)?.contacts||{}).filter(([,c])=>c&&contactKey(c.name||c.company,c.mobile)===d.key).map(([r])=>contactRoleLabel(r)).join(" · ")}</div></div>)}</div></td>
      <td style={cell}><DirectoryStars name={d.name||d.company} value={d.rating} disabled={busy} onChange={rating=>save([d.key],{rating})}/></td>
      <td style={cell}><div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:12}}><button type="button" disabled={busy} onClick={()=>start(d)} style={{...smallBtn,fontFamily:FONT_BODY}}>Edit / merge</button><button type="button" disabled={busy||!d.email} onClick={()=>setPortalContact(d)} style={{...smallBtn,fontFamily:FONT_BODY}}>Drawings / QR</button></div></td>
    </tr>)}</tbody></table>{!visible.length&&<p>No matching contacts.</p>}</div>
    {portalContact&&<DrawingPortalAccess contact={portalContact} state={state} onClose={()=>setPortalContact(null)}/>}
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

const WORKFLOW_WORKSPACE_CACHE=new Map();let WORKFLOW_WORKSPACE_REVISION=0;
function clearWorkflowWorkspaceCache(){WORKFLOW_WORKSPACE_REVISION++;WORKFLOW_WORKSPACE_CACHE.clear();}
function cachedWorkflowWorkspace(projectId){return WORKFLOW_WORKSPACE_CACHE.get(AUTH_SESSION_GENERATION+':'+projectId)?.data;}
function loadWorkflowWorkspace(projectId){const key=AUTH_SESSION_GENERATION+':'+projectId,existing=WORKFLOW_WORKSPACE_CACHE.get(key);if(existing?.promise)return existing.promise;if(existing?.data&&Date.now()-existing.at<15000)return Promise.resolve(existing.data);const revision=WORKFLOW_WORKSPACE_REVISION,generation=AUTH_SESSION_GENERATION,entry={...existing};entry.promise=apiRequest('getWorkflowWorkspace',{projectId},'GET',90000).then(data=>{if(revision!==WORKFLOW_WORKSPACE_REVISION||generation!==AUTH_SESSION_GENERATION)throw Error('Project data changed while refreshing. Reopen the project to load the latest values.');entry.data=data;entry.at=Date.now();return data;}).finally(()=>{entry.promise=null;});WORKFLOW_WORKSPACE_CACHE.set(key,entry);return entry.promise;}

async function apiRequest(action, payload = {}, method = "POST", timeoutMs=0) {
  const changesWorkflow=method==='POST'&&!/^(get|list|auth|begin|upload)/.test(action);if(changesWorkflow)clearWorkflowWorkspaceCache();
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
  if (!response.ok || !json?.ok) { const failure=new Error(json?.error?.message || `API request failed: ${action}`);failure.status=response.status;throw failure; }
  if(changesWorkflow)clearWorkflowWorkspaceCache();
  return json.data;
}

const projectApi = {
  saveMemberProjectRoles:payload=>apiRequest("saveMemberProjectRoles",payload,"POST",60000),
  deleteExecutionVisit:p=>apiRequest("deleteExecutionVisit",p),
  listMomTasks:projectId=>apiRequest("listMomTasks",{projectId},"GET"),
  updateMomTask:p=>apiRequest("updateMomTask",p),
  importMomTasks:projectId=>apiRequest("importMomTasks",{projectId}),
  transcribeVisitMom:p=>apiRequest("transcribeVisitMom",p,"POST",160000),
  draftVisitMom:p=>apiRequest("draftVisitMom",p,"POST",160000),
  listExecutionVisits:projectId=>apiRequest("listExecutionVisits",{projectId},"GET"),
  saveExecutionVisits:(projectId,rows,initializeOnly=false)=>apiRequest("saveExecutionVisits",{projectId,rows,initializeOnly}),
  recordExecutionVisit:p=>apiRequest("recordExecutionVisit",p),
  getProjectWorkspace:()=>apiRequest("getProjectWorkspace",{},"GET"),
  saveProjectMeeting:payload=>apiRequest("saveProjectMeeting",payload),
  deleteProjectMeeting:payload=>apiRequest("deleteProjectMeeting",payload),
  getDrawingPortal:()=>apiRequest('getDrawingPortal',{},'GET'),
  getPortalDrawingChunk:p=>apiRequest('getPortalDrawingChunk',p,'GET'),
  getDirectoryDrawingAccess:email=>apiRequest('getDirectoryDrawingAccess',{email},'GET'),
  saveDirectoryDrawingAccess:p=>apiRequest('saveDirectoryDrawingAccess',p),
  getIssueDrawingContext:p=>apiRequest('getIssueDrawingContext',p,'GET'),
  publishPortalDrawing:p=>apiRequest('publishPortalDrawing',p),
  trashProjectDrawing:p=>apiRequest('trashProjectDrawing',p),
  organizeProjectReceived:projectId=>apiRequest('organizeProjectReceived',{projectId}),
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
  getDriveLibraryConfig:()=>apiRequest('getDriveLibraryConfig',{},'GET'),
  setDriveLibraryRoot:p=>apiRequest('setDriveLibraryRoot',p),
  linkProjectDrive:p=>apiRequest('linkProjectDrive',p),
  listProjectDrive:p=>apiRequest('listProjectDrive',p,'GET'),
  listRecentDrawingRegister: () => apiRequest("listRecentDrawingRegister", {}, "GET"),
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
  return (workspace.drawings||[]).filter(d=>!d.duplicateOf&&!sheetDashboardFlag(d.trashed)&&String(d.direction||'Received').toLowerCase()==='received').map(d=>{
    const file=files.find(f=>f.linkedEntityId===d.drawingId)||files.find(f=>f.driveFileId&&f.driveFileId===d.driveFileId)||{};
    let floors=[];try{floors=JSON.parse(d.floorTags||'[]');}catch(_){}
    return {id:d.drawingId,projectId:d.projectId,floor:d.floor||'',floors:floors.length?floors:String(d.floor||'').split(',').map(x=>x.trim()).filter(Boolean),zone:'',areas:d.area?[d.area]:[],drawingType:canonicalDrawingType(d.drawingType),fileName:d.fileName||file.fileName||'Drawing',driveFileId:d.driveFileId||file.driveFileId||'',mimeType:d.mimeType||file.mimeType||'',driveUrl:d.driveUrl||file.driveUrl||'',note:d.notes||'',date:d.receivedSentDate||'',uploadedAt:d.createdAt||'',classified:d.classified===true||String(d.classified)==='true',source:'Received Upload'};
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

        if(user.appAccess==='Contractor'){clearStudioCaches();localState={projects:[],people:[],tasks:[],intakes:[],templates:[],meetings:[],pendingReceivedUploads:[],currentUser:user};setState(localState);return;}
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
    fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.02em", padding: "7px 10px",
    borderRadius: 0, cursor: disabled ? "not-allowed" : "pointer", border: `1px solid ${T.blue}`,
    display: "inline-flex", alignItems: "center", gap: 8, transition: "opacity .15s",
    opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    primary: { background: "#fff", color: T.blue },
    ghost: { background: "#fff", color: T.blue },
    dark: { background: "#E6EEF4", color: T.blue },
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

const smallBtn = { padding:"5px 9px", border:`1px solid ${T.blue}`, borderRadius:0, background:"#fff", color:T.blue, cursor:"pointer", fontFamily:FONT_MONO, fontSize:10, fontWeight:700 };

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
  const drawings=(data.drawings||[]).filter(d=>!d.duplicateOf&&!sheetDashboardFlag(d.trashed)&&String(d.projectId)===String(project.id));
  const files=(data.files||[]).filter(f=>!sheetDashboardFlag(f.trashed)&&String(f.projectId)===String(project.id));
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
    const row={id:key,date:sheetDashboardFlag(f.historicalImport)?f.originalDate||'':f.receivedSentDate||f.uploadedAt||'',fileName:f.fileName||'Drawing',drawingType:f.drawingType||'',revisionNo:f.revisionNo??'',driveUrl:f.driveUrl||'',mimeType:f.mimeType||'',coverage:[],sent:[]};addCoverage(row,f);groups.set(key,row);
  }
  // Classified area rows supersede the upload's whole-floor tags for the same file.
  for(const r of groups.values())r.coverage=r.coverage.filter(c=>c.area||!r.coverage.some(a=>a.floor===c.floor&&a.area));
  const sentSeen=new Map(),standalone=[];
  for(const f of [...files.filter(f=>String(f.direction).toLowerCase()==='sent'),...drawings.filter(d=>String(d.direction).toLowerCase()==='sent')]){
    const key=JSON.stringify([f.driveFileId||f.fileId||f.drawingId,f.revisionNo||'',f.drawingType||'']);if(sentSeen.has(key)){addCoverage(sentSeen.get(key),f);continue;}
    const task=tasks.find(t=>String(t.designTaskId)===String(f.linkedEntityId||f.designTaskId));
    const row={id:key,date:sheetDashboardFlag(f.historicalImport)?f.originalDate||'':f.receivedSentDate||f.uploadedAt||f.createdAt||task?.completedAt||'',fileName:f.fileName||task?.taskType||'Sent drawing',drawingType:f.drawingType||task?.taskType||'',revisionNo:f.revisionNo??'',driveUrl:f.driveUrl||'',mimeType:f.mimeType||'',coverage:[]};
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

function driveFileDate(value){if(!value||isNaN(new Date(value).getTime()))return '—';return new Date(value).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}
function driveFileSize(value){const bytes=Number(value);if(value===null||value===undefined||!Number.isFinite(bytes))return '—';return bytes>=1048576?(bytes/1048576).toFixed(1)+' MB':bytes>=1024?(bytes/1024).toFixed(1)+' KB':bytes+' B';}
function uploadTransientError(error){return [408,429,500,502,503,504].includes(error.status)||/connection ended|backend request failed|could not be confirmed within|network|failed to fetch|timed out|temporarily unavailable/i.test(error.message||'');}
async function uploadApiRequest(action,payload,timeout=90000){const generation=AUTH_SESSION_GENERATION;for(let attempt=0;;attempt++){if(generation!==AUTH_SESSION_GENERATION)throw Error('Sign-in changed. Retry after signing in.');try{return await apiRequest(action,payload,'POST',timeout);}catch(e){if(!uploadTransientError(e)||attempt>=2){const label=action.startsWith('begin')?'preparing the Drive folder':action.startsWith('finish')?'saving the drawing register':payload.probe?'checking Drive upload status':'transferring the file';const failure=new Error(`${e.message} [Upload step: ${label}; ${action}]`);failure.status=e.status;throw failure;}await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));}}}
async function transferDrawingToDrive(entry,file,onProgress=()=>{}){
 const probe=()=>uploadApiRequest('uploadReceivedChunk',{uploadTicket:entry.session.uploadTicket,probe:true});
 let result=entry.completion;
 if(result?.complete)return result;
 if(entry.session.sessionUrl&&!entry.directFailed){
  const u=new URL(entry.session.sessionUrl);if(u.protocol!=='https:'||u.hostname!=='www.googleapis.com'||u.pathname!=='/upload/drive/v3/files'||!u.searchParams.get('upload_id'))throw Error('Invalid Drive upload destination.');
  result=entry.transferStarted?await probe():{complete:false,nextOffset:0};
  if(!result.complete){
   const offset=result.nextOffset;entry.transferStarted=true;
   try{
    await new Promise((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open('PUT',u.href);xhr.timeout=90000;xhr.setRequestHeader('Content-Type',file.type||'application/octet-stream');xhr.setRequestHeader('Content-Range',`bytes ${offset}-${file.size-1}/${file.size}`);let last=-1;xhr.upload.onprogress=e=>{if(e.lengthComputable){const progress=Math.min(99,Math.floor((offset+e.loaded)/file.size*100));if(progress!==last){last=progress;onProgress(progress);}}};xhr.onload=()=>xhr.status>=200&&xhr.status<300||xhr.status===308?resolve():reject(Error('Direct transfer could not be confirmed.'));xhr.onerror=()=>reject(Error('Direct upload unavailable.'));xhr.ontimeout=()=>reject(Error('Direct upload timed out.'));xhr.send(file.slice(offset));});
   }catch(e){entry.directFailed=true;}
   // Only the authenticated server can issue a completion receipt after checking Drive.
   result=await probe();
  }
 }else result=result||await probe();
 let stalled=0,recoveries=0;
 while(!result.complete){const offset=result.nextOffset,end=Math.min(offset+Math.min(entry.session.chunkBytes,512*1024),file.size);if(end<=offset)throw Error('Drive has not confirmed completion. Retry to resume.');let next;try{next=await apiRequest('uploadReceivedChunk',{uploadTicket:entry.session.uploadTicket,offset,chunk:await uploadFileBase64(file.slice(offset,end))},'POST',90000);recoveries=0;}catch(e){if(!uploadTransientError(e)||recoveries++>=2)throw Error(e.message+' [Upload step: transferring the file]');await new Promise(resolve=>setTimeout(resolve,1000*recoveries));result=await probe();onProgress(Math.min(99,Math.floor(result.nextOffset/file.size*100)));continue;}stalled=next.nextOffset<=offset?stalled+1:0;if(stalled>1)throw Error('Upload stopped. Retry to resume.');result=next;onProgress(Math.min(99,Math.floor(result.nextOffset/file.size*100)));}
 entry.completion=result;onProgress(100);return result;
}

async function uploadProjectDrawingJob(file,projectId,destination,entry,onProgress,designTaskId){
  if(entry.file!==file||entry.projectId!==projectId||entry.destination!==destination||entry.designTaskId!==designTaskId){for(const key of Object.keys(entry))delete entry[key];Object.assign(entry,{file,projectId,destination,designTaskId,uploadId:'PRJ-UPL-'+uid()});}
  if(entry.saved)return entry.saved;
  const start=destination==='Base'?'beginBaseDrawingUpload':'beginWorkDrawingUpload',finish=destination==='Base'?'finishBaseDrawingUpload':'finishWorkDrawingUpload';
  const metadata={projectId,uploadId:entry.uploadId,designTaskId,fileName:file.name,mimeType:file.type||'application/octet-stream',fileSize:file.size};
  if(entry.session&&entry.failedExpired){entry.session=null;entry.completion=null;entry.transferStarted=false;entry.directFailed=false;entry.failedExpired=false;}
  if(!entry.session)entry.session=await uploadApiRequest(start,metadata,120000);
  if(entry.session.file){entry.saved=entry.session.file;return entry.saved;}
  const result=await transferDrawingToDrive(entry,file,onProgress);
  entry.completion=result;onProgress?.(100);entry.saved=await uploadApiRequest(finish,{completionTicket:result.completionTicket},120000);return entry.saved;
}
function BaseDrawingUpload({projectId,onSaved}){
  const [file,setFile]=useState(null),[busy,setBusy]=useState(false),[progress,setProgress]=useState(0),[error,setError]=useState('');const entry=useRef({}),input=useRef(null);
  const upload=async()=>{if(!file||busy)return;setBusy(true);setProgress(0);setError('');try{await uploadProjectDrawingJob(file,projectId,'Base',entry.current,setProgress);setFile(null);if(input.current)input.current.value='';onSaved();}catch(e){if(/expired|invalid.*session/i.test(e.message))entry.current.failedExpired=true;setError(e.message);}finally{setBusy(false);}};
  return <div style={{padding:'0 16px 14px',fontFamily:FONT_BODY}}><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><button type="button" disabled={busy} style={smallBtn} onClick={()=>input.current?.click()}>Choose edited base</button><input ref={input} aria-label="Edited base drawing" type="file" disabled={busy} style={{display:'none'}} onChange={e=>{if(e.target.files?.[0]){setFile(e.target.files[0]);setError('');}}}/><span style={{fontSize:11,color:T.inkDim,overflowWrap:'anywhere'}}>{file?.name||'Edited reference/layout files are saved in Base.'}</span>{file&&<button type="button" style={smallBtn} disabled={busy} onClick={upload}>{busy?`Uploading ${progress}%`:'Upload to Base'}</button>}</div>{error&&<p role="alert" style={{color:T.redline,fontSize:12,marginBottom:0}}>{error} Click Upload to Base to retry.</p>}</div>;
}

function projectSequenceNumber(project){
  const value=String(project.no||project.projectNo||'').trim();
  const token=value.includes('-')?value.split('-')[1].trim():value;
  return /^\d+$/.test(token)?Number(token):Number.POSITIVE_INFINITY;
}
function compareProjectSequence(a,b){
  const left=projectSequenceNumber(a),right=projectSequenceNumber(b);
  if(!Number.isFinite(left)||!Number.isFinite(right)){if(left!==right)return Number.isFinite(left)?-1:1;}
  else if(left!==right)return right-left;
  return String(a.no||a.projectNo||'').localeCompare(String(b.no||b.projectNo||''),undefined,{numeric:true})||String(a.name||'').localeCompare(String(b.name||''));
}
function orderedProjects(projects){return [...(projects||[])].sort(compareProjectSequence);}

function ProjectDriveView({state,persist}){
  const [trashBusy,setTrashBusy]=useState(false),[trashMessage,setTrashMessage]=useState('');
  const [folderNotice,setFolderNotice]=useState('');
  const [selectedFile,setSelectedFile]=useState(null);
  const [projectStatus,setProjectStatus]=useState('Ongoing');
  const [projectId,setProjectId]=useState(''),[category,setCategory]=useState(''),[path,setPath]=useState([]),[data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[revision,setRevision]=useState(0),[search,setSearch]=useState(''),[query,setQuery]=useState(''),[offset,setOffset]=useState(0),[projectSearch,setProjectSearch]=useState('');
  const [config,setConfig]=useState(null),[rootLink,setRootLink]=useState(''),[projectLink,setProjectLink]=useState(''),[linking,setLinking]=useState(false),[linkMessage,setLinkMessage]=useState('');
  const admin=state.currentUser?.appAccess?.toLowerCase()==='admin';
  const project=(state.projects||[]).find(p=>String(p.id)===projectId),categories=['Base','Output','Received','Sent'];
  const completed=p=>p.completed===true||String(p.completed).toLowerCase()==='true'||!!p.completedAt||[p.status,p.projectStatus,p.projectControl?.projectStatus].some(value=>String(value||'').toLowerCase()==='completed');
  const projects=orderedProjects(state.projects).filter(p=>completed(p)===(projectStatus==='Completed')).filter(p=>`${p.no} ${p.name}`.toLowerCase().includes(projectSearch.toLowerCase()));
  const folderId=path.at(-1)?.id||'';
  const driveListCache=useRef(new Map());
  useEffect(()=>{let live=true;setSelectedFile(null);setError('');setFolderNotice('');if(!projectId||!category){setData(null);setBusy(false);return;}
    const key=JSON.stringify([state.currentUser?.email,projectId,category,folderId,offset,query,revision]);
    const cached=driveListCache.current.get(key);setData(cached||null);setBusy(true);
    projectApi.listProjectDrive({projectId,category,folderId,offset,query}).then(r=>{if(live){driveListCache.current.set(key,r);setData(r);}}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setBusy(false);});return()=>{live=false;};
  },[projectId,category,folderId,offset,query,revision,state.currentUser?.email]);
  const chooseProject=id=>{setTrashMessage('');setProjectId(String(id));setCategory('');setPath([]);setQuery('');setSearch('');setOffset(0);setProjectLink('');setLinkMessage('');};
  const openCategory=value=>{setCategory(value);setPath([]);setOffset(0);setSearch('');setQuery('');};
  const saveLink=async kind=>{setLinking(true);setLinkMessage('');try{if(kind==='root'){const r=await projectApi.setDriveLibraryRoot({folder:rootLink});setConfig(r);setRootLink('');setLinkMessage('Projects folder linked. Select a project to link its folder.');}else{await projectApi.linkProjectDrive({projectId,folder:projectLink});setProjectLink('');setRevision(n=>n+1);setLinkMessage('Project folder linked. Base, Output, Received and Sent are ready.');}}catch(e){setLinkMessage(e.message);}finally{setLinking(false);}};
  const moveToTrash=async()=>{if(!selectedFile||trashBusy)return;setTrashBusy(true);setTrashMessage('Moving drawing to trash…');try{await projectApi.trashProjectDrawing({projectId,driveFileId:selectedFile.id});setSelectedFile(null);setRevision(n=>n+1);setTrashMessage('Drawing moved to Google Drive trash.');if(persist){try{const workspace=await projectApi.getProjectWorkspace();await persist(latest=>({...latest,intakes:workspaceIntakes(workspace)}));}catch{setTrashMessage('Drawing moved to trash. Refresh the app to update Classify.');}}}catch(e){setTrashMessage(e.message);}finally{setTrashBusy(false);}};
  const safeUrl=url=>{try{const u=new URL(url);return u.protocol==='https:'&&['drive.google.com','docs.google.com'].includes(u.hostname)?u.href:'';}catch{return '';}};
  return <section className="studio-drive" style={{fontFamily:FONT_BODY}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><h2 style={{fontFamily:FONT_DISPLAY,margin:'4px 0 8px'}}>Drive</h2><button type="button" style={smallBtn} disabled={!projectId||busy} onClick={()=>setRevision(n=>n+1)}>Refresh files</button></div><p style={{fontSize:12,color:T.inkDim,margin:'0 0 18px'}}>Project drawings · Base, Output, Received and Sent</p>
  {admin&&<details className="studio-drive-settings" onToggle={e=>{if(e.currentTarget.open&&!config)projectApi.getDriveLibraryConfig().then(setConfig).catch(e=>setLinkMessage(e.message));}}><summary style={{...smallBtn,display:'inline-block',fontWeight:500}}>Folder settings</summary><div className="studio-drive-settings-body" style={{display:'grid',gap:10,marginTop:10}}><div style={{fontSize:12,color:T.inkDim}}>Projects root: {config?.rootName||'Not linked'}</div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><input aria-label="Projects root folder link" placeholder="Paste your Google Drive projects folder link" value={rootLink} onChange={e=>setRootLink(e.target.value)} style={{...inputStyle,flex:'1 1 300px'}}/><button type="button" style={smallBtn} disabled={linking||!rootLink.trim()} onClick={()=>saveLink('root')}>Link projects root</button></div>{project&&<><label style={{fontSize:12}}>Link folder for {project.name}</label>{config?.folders?.length>0&&<select aria-label="Existing project Drive folders" value={projectLink} onChange={e=>setProjectLink(e.target.value)} style={inputStyle}><option value="">Choose an existing project folder…</option>{config.folders.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>}<div style={{display:'flex',gap:8,flexWrap:'wrap'}}><input aria-label="Project Drive folder link" value={projectLink} onChange={e=>setProjectLink(e.target.value)} placeholder="Or paste this project's Drive folder link" style={{...inputStyle,flex:'1 1 300px'}}/><button type="button" style={smallBtn} disabled={linking||!projectLink.trim()} onClick={()=>saveLink('project')}>Link project folder</button></div><p style={{fontSize:11,color:T.inkDim,margin:0}}>Existing Base, Output, Received and Sent folders are reused. Missing folders are created when linked.</p></>}{linkMessage&&<p role="status" style={{fontSize:12,margin:0}}>{linkMessage}</p>}</div></details>}
  {trashMessage&&<p role="status" style={{fontSize:12,color:T.inkDim}}>{trashMessage}</p>}
  <div className="project-drive-scroll"><div className={`project-drive-layout${selectedFile?' has-file-details':''}`}><nav aria-label="Drive project status" className="project-drive-status">{['Ongoing','Completed'].map(status=><button key={status} type="button" aria-pressed={projectStatus===status} onClick={()=>{setProjectStatus(status);setProjectSearch('');chooseProject('');}} style={{border:0,borderBottom:`1px solid ${T.line}`,background:projectStatus===status?'#E6EEF4':T.paper,color:projectStatus===status?T.blue:T.inkDim,fontFamily:FONT_BODY,fontSize:12,fontWeight:600,cursor:'pointer',writingMode:'vertical-rl',transform:'rotate(180deg)',padding:'20px 12px'}}>{status}</button>)}</nav><aside className="project-drive-projects" style={{background:'#fff',border:`1px solid ${T.line}`,minWidth:0}}><div style={{padding:12,background:T.paper,fontFamily:FONT_MONO,fontSize:10,letterSpacing:'.06em',color:T.inkDim}}>PROJECTS</div><input aria-label="Search Drive projects" placeholder="Search projects" value={projectSearch} onChange={e=>setProjectSearch(e.target.value)} style={{...inputStyle,width:'calc(100% - 20px)',margin:10}}/><div style={{flex:1,minHeight:0,overflowY:'auto'}}>{projects.map(p=><button key={p.id} type="button" aria-pressed={projectId===String(p.id)} onClick={()=>chooseProject(p.id)} style={{display:'flex',alignItems:'center',gap:10,width:'100%',border:0,borderBottom:0,borderLeft:`2px solid ${projectId===String(p.id)?T.blue:'transparent'}`,background:projectId===String(p.id)?'#E6EEF4':'transparent',color:T.ink,padding:'9px 12px',textAlign:'left',cursor:'pointer',fontFamily:FONT_BODY,fontSize:12}}><FolderOpen size={17} color={T.blue} style={{flexShrink:0}}/><span><span style={{fontFamily:FONT_MONO,fontSize:10,fontWeight:500,color:T.inkDim}}>{p.no||p.projectNo}</span><div style={{marginTop:3,fontSize:12,lineHeight:1.45,fontWeight:400}}>{p.name}</div></span></button>)}{!projects.length&&<p style={{padding:12,fontSize:12,color:T.inkDim}}>No projects found.</p>}</div></aside>
  <aside aria-label="Project Drive folders" className="project-drive-folders"><div style={{padding:12,background:T.paper,fontFamily:FONT_MONO,fontSize:10,letterSpacing:'.06em',color:T.inkDim}}>FOLDERS</div>{project?<><div style={{padding:12,fontFamily:FONT_BODY,fontSize:12,color:T.inkDim,borderBottom:`1px solid ${T.line}`}}>{project.name}</div>{categories.map(key=><button key={key} type="button" aria-pressed={category===key} onClick={()=>openCategory(key)} style={{display:'flex',alignItems:'center',gap:10,width:'100%',border:0,borderBottom:0,padding:'10px 12px',background:category===key?'#E6EEF4':'transparent',color:category===key?T.blue:T.ink,textAlign:'left',cursor:'pointer',fontFamily:FONT_BODY,fontSize:12}}><FolderOpen size={18} color={T.blue}/>{key}<ChevronRight size={13} style={{marginLeft:'auto'}}/></button>)}</>:<p style={{padding:12,fontSize:12,color:T.inkDim,lineHeight:1.6}}>Choose a project to view its folders.</p>}</aside>
  <main className="project-drive-files" style={{minWidth:0,border:0,background:'#fff'}}>{!project?<div className="studio-drive-empty"><FolderOpen size={32} color={T.blue} strokeWidth={1.2}/><strong style={{fontFamily:FONT_DISPLAY,fontSize:16,color:T.ink,fontWeight:500}}>Your project drawings</strong><span>Select {projectStatus==='Ongoing'?'an ongoing':'a completed'} project, then choose a folder.</span></div>:<><h3 style={{fontFamily:FONT_DISPLAY,fontSize:16,padding:'14px 16px',borderBottom:`1px solid ${T.line}`,margin:'0 0 12px'}}>{category||'Drawings'}</h3>{category==='Base'&&project&&state.currentUser?.appAccess?.toLowerCase()!=='viewer'&&<BaseDrawingUpload key={projectId} projectId={projectId} onSaved={()=>setRevision(n=>n+1)}/>}{folderNotice&&<p role="status" style={{padding:'0 16px',fontSize:11,color:T.inkDim}}>{folderNotice}</p>}{busy&&<p role="status" style={{padding:'0 16px',fontSize:12,color:T.inkDim}}>{data?'Updating file list…':'Loading file names…'}</p>}{error&&<p role="alert" style={{padding:16,fontSize:12,color:T.redline}}>{error}</p>}{data?.linked===false&&<p style={{padding:16,fontSize:12,color:T.inkDim}}>Project folders are created and linked automatically. If loading failed, check the Drive connection. {admin?'Use Link Google Drive folders above.':'Ask your administrator to link it.'}</p>}{data?.linked&&!category&&<p style={{padding:'0 16px 16px',fontSize:12,color:T.inkDim}}>Choose a folder above to view its files.</p>}{category&&data?.linked&&<><div style={{padding:'0 16px 12px',display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',fontSize:12}}><button type="button" style={smallBtn} onClick={()=>{setPath([]);setOffset(0);setQuery('');setSearch('');}}>{category}</button>{path.map((f,i)=><button type="button" key={f.id} style={smallBtn} onClick={()=>{setPath(p=>p.slice(0,i+1));setOffset(0);setQuery('');setSearch('');}}>› {f.name}</button>)}</div><form onSubmit={e=>{e.preventDefault();setQuery(search);setOffset(0);}} style={{display:'flex',gap:8,padding:'0 16px 12px'}}><input aria-label="Search current Drive folder" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search this folder" style={{...inputStyle,minWidth:0,flex:1}}/><button type="submit" style={smallBtn}>Search</button></form><div aria-label="Drawing files">{(data.entries||[]).filter((item,index,items)=>items.findIndex(other=>other.id===item.id)===index).map(item=><button key={item.id} type="button" aria-label={item.kind==='folder'?`Open ${item.name}`:`Details for ${item.name}`} aria-pressed={selectedFile?.id===item.id} onClick={()=>{if(item.kind==='folder'){setPath(p=>[...p,{id:item.id,name:item.name}]);setOffset(0);setSearch('');setQuery('');}else setSelectedFile(item);}} style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 16px',border:0,borderBottom:`1px solid ${T.line}`,background:selectedFile?.id===item.id?'#E6EEF4':'transparent',textAlign:'left',cursor:'pointer',fontFamily:FONT_BODY,color:T.ink}}>{item.kind==='folder'?<FolderOpen size={18} color="#489FC5"/>:<FileText size={17} color={T.blue}/>}<span style={{minWidth:0}}><span style={{display:'block',fontSize:12,lineHeight:1.45,overflowWrap:'anywhere'}}>{item.name}</span><span style={{display:'block',fontSize:10,color:T.inkDim,opacity:.8,lineHeight:1.5,marginTop:3}}>{formatProjectDate(item.receivedDate||item.created||item.modified)}</span></span></button>)}{!data.entries?.length&&<p style={{padding:24,color:T.inkDim,fontSize:12}}>{query?'No matching files in this folder.':'This folder is empty.'}</p>}</div><div style={{display:'flex',gap:8,padding:16}}>{offset>0&&<button type="button" style={smallBtn} onClick={()=>setOffset(n=>Math.max(0,n-100))}>Previous</button>}{data.nextOffset!==null&&data.nextOffset!==undefined&&<button type="button" style={smallBtn} onClick={()=>setOffset(data.nextOffset)}>Next</button>}</div></>}</>}</main>{selectedFile&&<aside aria-label="Drawing information" className="project-drive-file-details" style={{background:'#fff',borderLeft:`1px solid ${T.line}`,padding:18,overflowY:'auto',fontFamily:FONT_BODY}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}><h3 style={{fontFamily:FONT_DISPLAY,fontSize:16,margin:0}}>Information</h3><button type="button" aria-label="Close drawing information" style={smallBtn} onClick={()=>setSelectedFile(null)}>Close</button></div><div style={{display:'grid',justifyItems:'center',gap:12,padding:'18px 8px',color:T.blue}}><FileText size={54} strokeWidth={1}/><span style={{fontFamily:FONT_MONO,fontWeight:600,fontSize:14}}>{drawingFileType({fileName:selectedFile.name,mimeType:selectedFile.mimeType})}</span></div><h4 style={{fontFamily:FONT_DISPLAY,fontSize:16,lineHeight:1.5,overflowWrap:'anywhere',margin:'0 0 16px'}}>{selectedFile.name}</h4><dl style={{margin:0}}>{[['Name',selectedFile.name],['Type',drawingFileType({fileName:selectedFile.name,mimeType:selectedFile.mimeType})],['Size',driveFileSize(selectedFile.size)],['Created',driveFileDate(selectedFile.created)],['Modified',driveFileDate(selectedFile.modified)],['Project',project?.name],['Folder',[category,...path.map(f=>f.name)].join(' / ')]].map(([label,value])=><div key={label} style={{padding:'10px 0',borderBottom:`1px solid ${T.line}`,fontSize:12,lineHeight:1.5}}><dt style={{color:T.inkDim,marginBottom:3}}>{label}</dt><dd style={{margin:0,color:T.ink,overflowWrap:'anywhere'}}>{value||'—'}</dd></div>)}</dl>{safeUrl(selectedFile.url)&&<a href={safeUrl(selectedFile.url)} target="_blank" rel="noreferrer" style={{...smallBtn,display:'inline-block',marginTop:18}}>Open drawing</a>}{project&&(state.currentUser?.appAccess?.toLowerCase()==='admin'||state.currentUser?.appAccess?.toLowerCase()!=='viewer'&&projectRole(state,projectId)==='Admin')&&<div style={{marginTop:16}}><button type="button" disabled={trashBusy} style={smallBtn} onClick={moveToTrash}>{trashBusy?'Moving…':'Move to trash'}</button><p style={{fontSize:11,color:T.inkDim,lineHeight:1.5}}>Moves the selected drawing to Google Drive trash.</p></div>}{['Output','Sent'].includes(category)&&project&&(state.currentUser?.appAccess?.toLowerCase()==='admin'||state.currentUser?.appAccess?.toLowerCase()!=='viewer'&&projectRole(state,projectId)==='Admin')&&<IssueDrawingForm key={selectedFile.id} file={selectedFile} projectId={projectId} onIssued={()=>{setSelectedFile(null);setCategory('Sent');setPath([]);setOffset(0);setSearch('');setQuery('');setRevision(n=>n+1);}}/>}</aside>}</div></div></section>;
}

function inferDrawingProject(fileName,projects){
  const normalize=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const file=' '+normalize(String(fileName||'').replace(/\.[^.]+$/,''))+' ';
  const scores=(projects||[]).filter(p=>!p.completed&&!p.completedAt&&p.status!=='Completed'&&p.projectControl?.projectStatus!=='Completed').map(p=>{const no=normalize(p.no||p.projectNo),name=normalize(p.name);let score=0;if(no.length>=3&&file.includes(' '+no+' '))score=100+no.length;if(name.length>=5&&file.includes(' '+name+' '))score=Math.max(score,50+name.length);for(const token of [...no.split(' '),...name.split(' ')].filter(t=>t.length>=3&&/[0-9]/.test(t)))if(file.includes(' '+token+' '))score=Math.max(score,20+token.length);return {id:p.id,score};}).filter(p=>p.score).sort((a,b)=>b.score-a.score);
  return scores.length&&(!scores[1]||scores[0].score>scores[1].score)?scores[0].id:'';
}
function projectIsCompleted(project){return [project?.projectControl?.projectStatus,project?.status,project?.projectStatus].some(status=>/^(completed|complete|done)$/i.test(String(status||'').trim()))||!!project?.completedAt||project?.completed===true||project?.completed==='true';}
function ProjectStatusButtons({group,onChange,disabled}){return <div role="group" aria-label="Project status filter" style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:7}}>{['Ongoing','Completed'].map(name=><button key={name} type="button" disabled={disabled} aria-pressed={group===name} onClick={()=>onChange(name)} style={{...smallBtn,padding:'6px 11px',fontFamily:FONT_BODY,background:group===name?T.navy:T.paper,color:group===name?'#fff':T.ink,borderColor:group===name?T.navy:T.line}}>{name} projects</button>)}</div>;}
function ProjectStatusSelect({projects=[],children,...props}){
 const current=projects.find(p=>String(p.id)===String(props.value));const [group,setGroup]=useState(()=>current&&projectIsCompleted(current)?'Completed':'Ongoing');
 useEffect(()=>{if(current)setGroup(projectIsCompleted(current)?'Completed':'Ongoing');},[props.value,current&&projectIsCompleted(current)]);
 const options=React.Children.toArray(children),ids=new Set(projects.filter(p=>projectIsCompleted(p)===(group==='Completed')).map(p=>String(p.id)));
 const changeGroup=name=>{setGroup(name);const allowed=new Set(projects.filter(p=>projectIsCompleted(p)===(name==='Completed')).map(p=>String(p.id)));if(!allowed.has(String(props.value))){const placeholder=options.find(o=>String(o.props?.value??'')===''),first=options.find(o=>allowed.has(String(o.props?.value)));props.onChange?.({target:{value:placeholder?'':String(first?.props?.value??'')}});}};
 return <div style={{minWidth:0,flex:'1 1 auto',marginBottom:props.style?.marginBottom}}><ProjectStatusButtons group={group} onChange={changeGroup} disabled={props.disabled}/><select {...props} style={{...props.style,marginBottom:0}}>{options.filter(o=>!o.props||String(o.props.value??'')===''||ids.has(String(o.props.value)))}</select>{!ids.size&&<div style={{fontSize:11,color:T.inkDim,marginTop:5}}>No {group.toLowerCase()} projects available.</div>}</div>;
}
function DrawingProjectSelect({value,projects=[],onChange}){
 const current=projects.find(p=>String(p.id)===String(value)),[group,setGroup]=useState(()=>current&&projectIsCompleted(current)?'Completed':'Ongoing');
 useEffect(()=>{if(current)setGroup(projectIsCompleted(current)?'Completed':'Ongoing');},[value,current&&projectIsCompleted(current)]);
 const filtered=projects.filter(p=>projectIsCompleted(p)===(group==='Completed'));
 return <div><ProjectStatusButtons group={group} onChange={name=>{setGroup(name);if(current&&projectIsCompleted(current)!==(name==='Completed'))onChange('');}}/><DrawingProjectSelectList value={value} projects={filtered} onChange={onChange}/>{!filtered.length&&<p style={{fontSize:11,color:T.inkDim}}>No {group.toLowerCase()} projects available.</p>}</div>;
}

function DrawingProjectSelectList({value,projects,onChange}){
  const [open,setOpen]=useState(false),[active,setActive]=useState(0);
  const ref=useRef(null),buttonRef=useRef(null),typed=useRef({text:'',at:0});
  const options=[{value:'',label:'Select a Project'},...(projects||[]).map(p=>({value:String(p.id),label:`${p.no||''} · ${p.name}${p.status==='Completed'||p.completedAt?' · Completed':''}`}))];
  const selected=Math.max(0,options.findIndex(o=>o.value===String(value)));
  const choose=index=>{onChange(options[index].value);setOpen(false);buttonRef.current?.focus();};
  useEffect(()=>{if(!open||typeof document==='undefined')return;const close=e=>{if(!ref.current?.contains(e.target))setOpen(false);};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[open]);
  useEffect(()=>{if(open)ref.current?.querySelector?.(`[data-project-option="${active}"]`)?.scrollIntoView?.({block:'nearest'});},[active,open]);
  const keyDown=e=>{if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();setOpen(true);setActive(i=>e.key==='Home'?0:e.key==='End'?options.length-1:!open?selected:Math.max(0,Math.min(options.length-1,i+(e.key==='ArrowDown'?1:-1))));}else if(e.key==='Enter'||e.key===' '){e.preventDefault();if(open)choose(active);else{setActive(selected);setOpen(true);}}else if(e.key==='Escape'){e.preventDefault();setOpen(false);}else if(e.key==='Tab')setOpen(false);else if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){const now=Date.now();typed.current={text:(now-typed.current.at<700?typed.current.text:'')+e.key.toLowerCase(),at:now};const index=options.findIndex(o=>o.label.toLowerCase().startsWith(typed.current.text));if(index>=0){setOpen(true);setActive(index);}}};
  return <div ref={ref} style={{position:'relative',minWidth:0,fontFamily:FONT_BODY,fontSize:13,fontWeight:400,letterSpacing:0}}><button ref={buttonRef} type="button" role="combobox" aria-label="Drawing register project" aria-expanded={open} aria-haspopup="listbox" aria-controls="drawing-project-options" aria-activedescendant={open?`drawing-project-option-${active}`:undefined} onKeyDown={keyDown} onClick={()=>{setActive(selected);setOpen(v=>!v);}} style={{...inputStyle,fontFamily:FONT_BODY,fontSize:13,fontWeight:400,letterSpacing:0,lineHeight:1.5,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,textAlign:'left',cursor:'pointer'}}><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{options[selected].label}</span><ChevronDown size={15} style={{flexShrink:0,marginRight:5}}/></button>{open&&<div role="listbox" id="drawing-project-options" aria-label="Projects" style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,zIndex:1000,maxHeight:320,overflowY:'auto',background:T.paper,border:`1px solid ${T.line}`,boxShadow:'0 6px 18px #08192d20',fontFamily:FONT_BODY,fontSize:13,fontWeight:400,letterSpacing:0}}>{options.map((option,i)=><div key={option.value} id={`drawing-project-option-${i}`} role="option" aria-selected={i===selected} data-project-option={i} onMouseDown={e=>e.preventDefault()} onMouseEnter={()=>setActive(i)} onClick={()=>choose(i)} style={{padding:'5px 12px',borderBottom:0,background:i===active?'#E6EEF4':'transparent',color:T.ink,fontFamily:FONT_BODY,fontSize:13,fontWeight:400,letterSpacing:0,lineHeight:1.5,cursor:'pointer',overflowWrap:'anywhere'}}>{option.label}</div>)}</div>}</div>;
}

async function uploadPastWorkFile(row,projectId,entry,onProgress){
 const file=row.file,metadata={projectId,uploadId:entry.uploadId||(entry.uploadId='PAST-'+uid()),destination:row.destination,originalDate:row.originalDate,revisionNo:row.revisionNo,drawingCode:row.drawingCode,floor:row.floor,area:row.area,fileName:file.name,mimeType:file.type||'application/octet-stream',fileSize:file.size};
 if(!entry.session)entry.session=await uploadApiRequest('beginPastWorkUpload',metadata,120000);
 if(entry.session.file)return entry.session.file;
 const result=await transferDrawingToDrive(entry,file,onProgress);
 entry.completion=result;return uploadApiRequest('finishPastWorkUpload',{completionTicket:result.completionTicket},120000);
}
function PastWorkImport({state,initialProjectId,onSaved,onClose,initialFiles=[],embedded=false,onBusy}){
 const projects=orderedProjects(state.projects).filter(p=>state.currentUser?.appAccess?.toLowerCase()==='admin'||projectRole(state,p.id)==='Admin');
 const [projectId,setProjectId]=useState(projects.some(p=>String(p.id)===String(initialProjectId))?initialProjectId:''),[rows,setRows]=useState(()=>initialFiles.map(file=>({id:uid(),file,destination:'Received',originalDate:'',revisionNo:'',drawingCode:'',floor:'',area:'',status:file.size>0&&file.size<=100*1024*1024?'Ready':'Invalid',error:file.size>100*1024*1024?'Maximum 100 MB per file.':file.size?'':'File is empty.'}))),[busy,setBusy]=useState(false),[defaults,setDefaults]=useState({destination:'Received',originalDate:'',revisionNo:'',drawingCode:'',floor:'',area:''});
 const jobs=useRef(new Map()),running=useRef(false);
 const patch=(id,values)=>setRows(all=>all.map(r=>r.id===id?{...r,...values}:r));
 const add=files=>setRows(all=>[...all,...Array.from(files||[]).map(file=>({id:uid(),file,...defaults,status:file.size>0&&file.size<=100*1024*1024?'Ready':'Invalid',error:file.size>100*1024*1024?'Maximum 100 MB per file.':file.size?'':'File is empty.'}))]);
 const fields=[['originalDate','Original date'],['revisionNo','Revision'],['drawingCode','Drawing type/code'],['floor','Floor(s)'],['area','Area(s)']];
 const run=async()=>{if(running.current||!projectId)return;running.current=true;setBusy(true);onBusy?.(true);try{for(const row of rows.filter(r=>['Ready','Failed'].includes(r.status))){patch(row.id,{status:'Uploading',error:''});let entry=jobs.current.get(row.id);if(!entry){entry={};jobs.current.set(row.id,entry);}try{await uploadPastWorkFile(row,projectId,entry,n=>patch(row.id,{progress:n}));patch(row.id,{status:'Imported',progress:100});onSaved(projectId);}catch(e){patch(row.id,{status:'Failed',error:e.message});}}}finally{running.current=false;setBusy(false);onBusy?.(false);}};
 const input={...inputStyle,fontFamily:FONT_BODY,fontSize:12,width:'100%',minWidth:100};
 return <section aria-label="Import past work" style={{border:`1px solid ${T.line}`,background:'#fff',padding:18,margin:'16px 0',fontFamily:FONT_BODY}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><h3 style={{fontFamily:FONT_DISPLAY,margin:0,fontSize:18}}>Import Past Work</h3>{!embedded&&<button type="button" disabled={busy} style={smallBtn} onClick={onClose}>Close</button>}</div><p style={{fontSize:12,color:T.inkDim,lineHeight:1.6}}>Archive previous drawings and revisions. Original dates and revisions are optional. This does not create tasks, change project status or share files with contractors. Keep this panel open while importing; failed files can be retried.</p><label style={{display:embedded?'none':'grid',gap:6,fontSize:12,maxWidth:600}}>Project — ongoing or completed<ProjectStatusSelect projects={projects} aria-label="Past work project" disabled={busy||rows.some(r=>['Imported','Failed'].includes(r.status))} style={input} value={projectId} onChange={e=>setProjectId(e.target.value)}><option value="">Select a project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.no} · {p.name}{p.completed||/completed/i.test(p.projectStatus||p.status||'')?' (Completed)':''}</option>)}</ProjectStatusSelect></label><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10,marginTop:16}}><label style={{fontSize:12}}>Folder<select aria-label="Past work default folder" disabled={busy} style={input} value={defaults.destination} onChange={e=>setDefaults(d=>({...d,destination:e.target.value}))}>{['Received','Base','Output','Sent'].map(v=><option key={v}>{v}</option>)}</select></label>{fields.map(([key,label])=><label key={key} style={{fontSize:12}}>{label}<input aria-label={`Past work default ${label}`} disabled={busy} type={key==='originalDate'?'date':'text'} style={input} value={defaults[key]} onChange={e=>setDefaults(d=>({...d,[key]:e.target.value}))}/></label>)}</div><div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',margin:'12px 0'}}><button type="button" style={smallBtn} disabled={busy} onClick={()=>setRows(all=>all.map(r=>r.status==='Ready'?{...r,...defaults}:r))}>Apply details to ready files</button><label style={{...smallBtn,cursor:busy?'default':'pointer'}}>Choose files<input aria-label="Choose historical drawings" multiple type="file" disabled={busy} style={{display:'none'}} onChange={e=>{add(e.target.files);e.target.value='';}}/></label><label style={{...smallBtn,cursor:busy?'default':'pointer'}}>Choose folder<input aria-label="Choose historical drawing folder" type="file" multiple webkitdirectory="" disabled={busy} style={{display:'none'}} onChange={e=>{add(e.target.files);e.target.value='';}}/></label></div><div onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(!busy)add(e.dataTransfer.files);}} style={{padding:12,border:`1px dashed ${T.line}`,fontSize:12,color:T.inkDim}}>Drop drawing files here · up to 100 MB each</div>{rows.length>0&&<div style={{overflowX:'auto',marginTop:12}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['File','Folder',...fields.map(f=>f[1]),'Status',''].map((label,i)=><th key={i} style={{padding:8,background:'#D2CDC1',color:T.ink,textAlign:'left',fontSize:11}}>{label}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id}><td style={{padding:8,fontSize:12,minWidth:180,overflowWrap:'anywhere'}}>{r.file.webkitRelativePath||r.file.name}</td><td style={{padding:5}}><select aria-label={`Folder for ${r.file.name}`} disabled={busy||r.status!=='Ready'} value={r.destination} style={input} onChange={e=>patch(r.id,{destination:e.target.value})}>{['Received','Base','Output','Sent'].map(v=><option key={v}>{v}</option>)}</select></td>{fields.map(([key,label])=><td key={key} style={{padding:5}}><input aria-label={`${label} for ${r.file.name}`} disabled={busy||r.status!=='Ready'} type={key==='originalDate'?'date':'text'} style={input} value={r[key]} onChange={e=>patch(r.id,{[key]:e.target.value})}/></td>)}<td role="status" style={{padding:8,fontSize:11,minWidth:130,color:r.error?T.redline:T.inkDim}}>{r.status}{r.status==='Uploading'?` ${r.progress||0}%`:''}{r.error&&<div>{r.error}</div>}</td><td><button type="button" disabled={busy||r.status==='Imported'} style={smallBtn} onClick={()=>setRows(all=>all.filter(x=>x.id!==r.id))}>Remove</button></td></tr>)}</tbody></table></div>}<div style={{display:'flex',gap:12,alignItems:'center',marginTop:16}}><button type="button" style={{...smallBtn,background:T.navy,color:'#fff'}} disabled={busy||!projectId||!rows.some(r=>['Ready','Failed'].includes(r.status))} onClick={run}>{busy?'Importing…':'Import / Retry pending files'}</button><span style={{fontSize:12,color:T.inkDim}}>{rows.filter(r=>r.status==='Imported').length} of {rows.length} imported</span></div></section>;
}

function UnifiedDrawingUpload({state,persist,file,initialProjectId,onQueued,onImported,onBusy}){
 const projects=orderedProjects(state.projects);
 const [projectId,setProjectId]=useState(initialProjectId||projects[0]?.id||''),[past,setPast]=useState(false),[busy,setBusy]=useState(false);
 const project=projects.find(p=>String(p.id)===String(projectId));
 const completed=project&&(sheetDashboardFlag(project.completed)||!!project.completedAt||!!project.completedDate||[project.status,project.projectStatus,project.projectControl?.projectStatus].some(v=>String(v||'').toLowerCase()==='completed'));
 const historical=completed||past,canImport=state.currentUser?.appAccess?.toLowerCase()==='admin'||projectRole(state,projectId)==='Admin';
 return <div><label style={{display:'grid',gap:6,fontFamily:FONT_BODY,fontSize:12}}>Project<ProjectStatusSelect projects={projects} aria-label="Upload project" disabled={busy} value={projectId} style={inputStyle} onChange={e=>{setProjectId(e.target.value);setPast(false);}}><option value="">Select a project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.no} · {p.name}</option>)}</ProjectStatusSelect></label>{project&&!completed&&canImport&&<label style={{display:'flex',alignItems:'center',gap:8,fontFamily:FONT_BODY,fontSize:12,margin:'14px 0'}}><input type="checkbox" aria-label="Import as past work" disabled={busy} checked={past} onChange={e=>setPast(e.target.checked)}/> Import as past work</label>}{completed&&<p style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim}}>Completed project — historical upload. Original dates and revisions can be entered below. No new Work in Hand tasks will be created.</p>}{project&&(historical?(canImport?<PastWorkImport key={projectId} state={state} initialProjectId={projectId} initialFiles={[file]} embedded onBusy={value=>{setBusy(value);onBusy?.(value);}} onSaved={onImported} onClose={()=>{}}/>:<p role="alert" style={{fontSize:12,color:T.redline}}>A project admin can import historical drawings for this completed project.</p>):<UploadView key={projectId} state={state} persist={persist} initialFile={file} initialProjectId={projectId} hideProjectPicker compact onQueued={onQueued}/>)}</div>;
}

function AppErrorNotice({message,onRetry}){return <div role="alert" className="app-error-notice" style={{'--app-font-body':FONT_BODY}}><div style={{flex:1,minWidth:0}}><strong style={{display:'block',fontSize:12,fontWeight:600,marginBottom:3}}>Unable to confirm the request</strong><span>{message}</span></div>{onRetry&&<button type="button" onClick={onRetry} style={{...smallBtn,alignSelf:'center',flexShrink:0}}>Retry</button>}</div>;}
function EmailDrawingInbox(){const [open,setOpen]=useState(false),[rows,setRows]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState('');const load=async()=>{setBusy(true);setError('');try{setRows(await apiRequest('listEmailDrawingIntakes',{},'GET',90000));}catch(e){setError(e.message);}finally{setBusy(false);}};return <section style={{marginBottom:16,fontFamily:FONT_BODY}}><button type="button" aria-expanded={open} style={smallBtn} onClick={()=>{setOpen(v=>!v);if(!open)load();}}>Incoming email drawings</button>{open&&<div style={{border:`1px solid ${T.line}`,padding:14,marginTop:10}}><div style={{display:'flex',justifyContent:'space-between',gap:12}}><p style={{fontSize:12,color:T.inkDim,marginTop:0}}>Forward drawings to your configured intake mailbox. Reply to the assistant's questions by email to confirm upload.</p><button type="button" style={smallBtn} disabled={busy} onClick={load}>Refresh</button></div>{busy&&<p role="status" style={{fontSize:12}}>Loading incoming drawings…</p>}{error&&<AppErrorNotice message={error} onRetry={load}/>}<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr>{['Drawings','Sender','Status'].map(h=><th key={h} style={{padding:9,textAlign:'left',background:'#D2CDC1'}}>{h}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id}><td style={{padding:9,borderBottom:`1px solid ${T.line}`}}>{r.files.map((f,i)=><div key={i}>{f.url?<a href={f.url} target="_blank" rel="noopener noreferrer">{f.name}</a>:f.name}</div>)}</td><td style={{padding:9,borderBottom:`1px solid ${T.line}`}}>{r.sender}</td><td style={{padding:9,borderBottom:`1px solid ${T.line}`}}>{r.status}{r.error&&<div style={{fontSize:11,color:T.redline,marginTop:4}}>{r.error}</div>}</td></tr>)}</tbody></table></div>{!rows.length&&!busy&&!error&&<p style={{fontSize:12,color:T.inkDim}}>No incoming drawings yet. Email intake must be configured and enabled by the mailbox owner.</p>}</div>}</section>;}
function ReceivedSentView({state,persist}){
  const [historicalBusy,setHistoricalBusy]=useState(false);
  const [projectId,setProjectId]=useState('');
  const [dropFile,setDropFile]=useState(null),[dragging,setDragging]=useState(false),[dropError,setDropError]=useState(''),[uploadHint,setUploadHint]=useState('');
  const dropInput=useRef(null),dropButton=useRef(null),dragDepth=useRef(0);
  const canReceive=!!persist&&state.currentUser?.appAccess?.toLowerCase()!=='viewer'&&!!state.currentUser;
  const openDrawing=files=>{setDragging(false);dragDepth.current=0;setDropError('');if(!canReceive)return;if(files?.length!==1){setDropError('Drop one drawing at a time. You can tag multiple floors in the form.');return;}if(!files[0].size){setDropError('Choose a non-empty drawing file.');return;}setDropFile(files[0]);};
  const closeUpload=()=>{if(historicalBusy)return;setDropFile(null);dropButton.current?.focus();};
  const [result,setResult]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[query,setQuery]=useState(''),[revision,setRevision]=useState(0);
  const project=(state.projects||[]).find(p=>String(p.id)===String(projectId));
  useEffect(()=>{let live=true;setResult(null);setError('');setLoading(true);(projectId?projectApi.listDrawingRegister(projectId):projectApi.listRecentDrawingRegister()).then(data=>{if(live)setResult({projectId,data});}).catch(err=>{if(live)setError(err.message||'Could not load drawing register.');}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[projectId,revision,state.intakes,state.projects]);
  const groups=result?.projectId===projectId?(project?[project]:state.projects||[]).flatMap(p=>buildDrawingRegister(p,result.data).map(g=>({...g,project:p,id:JSON.stringify([p.id,g.id])}))).sort((a,b)=>String(b.received?.date||b.sent[0]?.date||'').localeCompare(String(a.received?.date||a.sent[0]?.date||''))):[];
  const filtered=groups.filter(g=>[g.received,...g.sent].filter(Boolean).some(r=>[g.project.name,g.project.no,r.fileName,r.drawingType,r.revisionNo,...r.coverage.flatMap(c=>[c.floor,c.area])].join(' ').toLowerCase().includes(query.toLowerCase())));
  const cell={padding:'12px 10px',border:`1px solid ${T.line}`,verticalAlign:'top',textAlign:'left',fontFamily:FONT_BODY,fontSize:12,lineHeight:1.5,overflowWrap:'anywhere'};
  const head={...cell,background:'#D2CDC1',color:T.ink,fontFamily:FONT_MONO,fontSize:10,fontWeight:700,border:'1px solid #9D998F',borderBottom:'1px solid #B8B5AC'};
  const safeLink=url=>{try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}};
  const link=r=>safeLink(r.driveUrl)?<a href={safeLink(r.driveUrl)} target="_blank" rel="noreferrer" aria-label={`Open ${drawingFileType(r)} file ${r.fileName}`} style={{color:T.blue,fontWeight:600,whiteSpace:'nowrap'}}>{drawingFileType(r)}</a>:<span style={{color:T.inkDim}}>No file link</span>;
  return <section style={{fontFamily:FONT_BODY}}><h2 style={{fontFamily:FONT_DISPLAY,margin:'4px 0 8px'}}>Received / Sent</h2><p style={{fontSize:13,color:T.inkDim}}>Project drawing register. Expand a floor summary to see every selected zone. Sent files are recorded design outputs; opening this page does not send files.</p>
    <EmailDrawingInbox/>{canReceive&&<><div className={`received-drawing-drop${dragging?' is-dragging':''}${dropFile?' is-open':''}`} onDragEnter={e=>{e.preventDefault();dragDepth.current++;setDragging(true);}} onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect='copy';}} onDragLeave={e=>{e.preventDefault();dragDepth.current=Math.max(0,dragDepth.current-1);if(!dragDepth.current)setDragging(false);}} onDrop={e=>{e.preventDefault();openDrawing(e.dataTransfer.files);}}><button ref={dropButton} type="button" aria-label="Upload received drawing" style={{border:0,background:'transparent',cursor:'pointer',padding:4}} onClick={()=>dropInput.current?.click()}><img src="/received-drawing-folder.png" alt="" className="received-drawing-folder"/></button><div><strong style={{fontFamily:FONT_DISPLAY,fontSize:15}}>Drop a received drawing here</strong><p style={{fontSize:12,color:T.inkDim,margin:'5px 0'}}>or click the folder to choose a file. Confirm project, floors and drawing details before logging.</p></div><input ref={dropInput} type="file" aria-label="Choose received drawing" style={{display:'none'}} onChange={e=>{openDrawing(e.target.files);e.target.value='';}}/></div>{dropError&&<p role="alert" style={{color:T.redline,fontSize:12}}>{dropError}</p>}{uploadHint&&<p role="status" style={{fontSize:12,color:T.inkDim}}>{uploadHint}</p>}<PendingReceivedUploads state={state} persist={persist}/></>}
    {dropFile&&<div role="dialog" aria-modal="true" aria-label="Log received drawing" onKeyDown={e=>{if(e.key==='Escape')closeUpload();if(e.key==='Tab'){const items=[...e.currentTarget.querySelectorAll('button:not(:disabled),select:not(:disabled),input:not(:disabled),textarea:not(:disabled)')].filter(n=>n.type!=='hidden');const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}} style={{position:'fixed',inset:0,zIndex:15000,background:'rgba(8,25,45,.45)',display:'flex',justifyContent:'flex-end'}}><div style={{background:T.paper,width:520,maxWidth:'100%',height:'100%',display:'flex',flexDirection:'column',boxShadow:'-8px 0 30px #08192d20',fontFamily:FONT_BODY}}><div style={{padding:'18px 20px',borderBottom:`1px solid ${T.line}`,display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><h3 style={{fontFamily:FONT_DISPLAY,fontSize:18,margin:0}}>Received — Upload</h3><button autoFocus type="button" disabled={historicalBusy} style={smallBtn} onClick={closeUpload}>Close</button></div><div style={{padding:20,overflowY:'auto',flex:1}}><p style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim}}>{inferDrawingProject(dropFile.name,state.projects)?'Project matched from the filename. Please confirm it below.':'No unique project match found in the filename. Please confirm the project below.'}</p><UnifiedDrawingUpload key={dropFile.name+dropFile.lastModified} state={state} persist={persist} file={dropFile} initialProjectId={inferDrawingProject(dropFile.name,state.projects)||projectId} onBusy={setHistoricalBusy} onImported={()=>{setRevision(n=>n+1);setUploadHint("Historical drawing imported. It is available in the register and Drive archive.");}} onQueued={id=>{setProjectId(current=>current?id:'');setUploadHint('Drawing queued for upload. This register refreshes automatically when Google Drive and Sheets confirm the save.');closeUpload();}}/></div></div></div>}
    <div style={{display:'flex',gap:12,alignItems:'flex-end',flexWrap:'wrap',marginBottom:16}}><div style={{display:'grid',gap:6,fontSize:12,flex:'1 1 320px'}}><span>Project</span><DrawingProjectSelect value={projectId} projects={state.projects||[]} onChange={id=>{setProjectId(id);setQuery('');}}/></div><input aria-label="Search drawing register" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search drawing, floor, area, type or revision" style={{...inputStyle,flex:'1 1 260px'}}/><button type="button" style={smallBtn} disabled={loading} onClick={()=>setRevision(n=>n+1)}>Refresh</button></div>
    {!!result?.data?.files?.some(f=>sheetDashboardFlag(f.historicalImport)&&(!projectId||String(f.projectId)===String(projectId)))&&<details style={{margin:'16px 0',border:`1px solid ${T.line}`,padding:12}}><summary style={{cursor:'pointer',fontFamily:FONT_BODY,fontSize:13}}>Past work archive — all folders and revisions</summary><div style={{overflowX:'auto',marginTop:10}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr>{['Project','Drawing','Folder','Original date','Revision','Type','Floor / Area','File'].map(h=><th key={h} style={{padding:8,textAlign:'left',background:'#D2CDC1',color:T.ink}}>{h}</th>)}</tr></thead><tbody>{result.data.files.filter(f=>sheetDashboardFlag(f.historicalImport)&&!sheetDashboardFlag(f.trashed)&&(!projectId||String(f.projectId)===String(projectId))).sort((a,b)=>String(b.originalDate||'').localeCompare(String(a.originalDate||''))).map(f=><tr key={f.fileId}>{[(state.projects||[]).find(p=>String(p.id)===String(f.projectId))?.no||'',f.fileName,f.direction,formatProjectDate(f.originalDate),f.revisionNo||'—',f.drawingCode||'—',[f.floor,f.area].filter(Boolean).join(' / ')||'—'].map((v,i)=><td key={i} style={{padding:8,borderBottom:`1px solid ${T.line}`}}>{v}</td>)}<td style={{padding:8}}>{link(f)}</td></tr>)}</tbody></table></div></details>}
    {loading&&<p role="status" style={{fontFamily:FONT_BODY,fontSize:13,fontWeight:400,lineHeight:1.5,color:T.inkDim,margin:"12px 0"}}>Loading drawing register…</p>}{error&&<AppErrorNotice message={error} onRetry={()=>setRevision(n=>n+1)}/>}
    {!loading&&!error&&result&&<><p style={{fontSize:12,color:T.inkDim}}>{groups.filter(g=>g.received).length} received file(s) · {groups.reduce((n,g)=>n+g.sent.length,0)} sent file(s)</p><div style={{overflowX:'auto'}}><table style={{width:'100%',minWidth:1380,borderCollapse:'collapse',tableLayout:'fixed'}}><colgroup>{[85,125,205,85,190,60,80,205,160,60,85,80].map((w,i)=><col key={i} style={{width:w}}/>)}</colgroup><thead><tr><th colSpan={7} style={{...head,background:'#D2CDC1',textAlign:'center',fontSize:12,borderRight:`3px solid ${T.ink}`}}>RECEIVED</th><th colSpan={5} style={{...head,background:T.navy,color:'#fff',textAlign:'center',fontSize:12,borderLeft:`3px solid ${T.ink}`}}>SENT</th></tr><tr>{['Date','Project','Floor / Zones','Type','Drawing Name','Rev No.','Link','Floor / Type','Drawing Name','Rev No.','Issue Date','Link'].map((h,i)=><th key={i} style={{...head,...(i===7?{borderLeft:`3px solid ${T.ink}`}:{})}}>{h}</th>)}</tr></thead><tbody>{filtered.flatMap(g=>Array.from({length:Math.max(1,g.sent.length)},(_,i)=>{const project=g.project,r=g.received,sent=g.sent[i],span=Math.max(1,g.sent.length);return <tr key={`${g.id}-${i}`} style={{background:i%2?'#fff':'transparent'}}>{i===0&&(r?<><td rowSpan={span} style={cell}>{formatProjectDate(r.date)}</td><td rowSpan={span} style={cell}>{project.no||project.name}</td><td rowSpan={span} style={cell}><DrawingCoverage row={r} project={project}/></td><td rowSpan={span} style={cell}>{r.drawingType||'—'}</td><td rowSpan={span} style={cell}>{r.fileName}</td><td rowSpan={span} style={cell}>{r.revisionNo!==''?r.revisionNo:'—'}</td><td rowSpan={span} style={{...cell,borderRight:`3px solid ${T.ink}`}}>{link(r)}</td></>:<td colSpan={7} rowSpan={span} style={{...cell,color:T.inkDim}}>{project.no||project.name} · Sent drawing · no received source linked</td>)}{sent?<><td style={{...cell,borderLeft:`3px solid ${T.ink}`}}><DrawingCoverage row={sent} project={project}/><div style={{fontSize:11,color:T.inkDim,marginTop:6}}>{sent.drawingType}</div></td><td style={cell}>{sent.fileName}</td><td style={cell}>{sent.revisionNo!==''?sent.revisionNo:'—'}</td><td style={cell}>{formatProjectDate(sent.date)}</td><td style={cell}>{link(sent)}</td></>:<td colSpan={5} style={{...cell,color:T.inkDim,borderLeft:`3px solid ${T.ink}`}}>No sent drawing linked yet</td>}</tr>;}))}{!filtered.length&&<tr><td colSpan={12} style={cell}>No drawings found{project?' for this project':''}{query?' matching your search':''}.</td></tr>}</tbody></table></div></>}
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
        if(!entry.session){
          await update({phase:'Opening Google Drive upload…'});
          entry.session=await uploadApiRequest('beginReceivedUpload',metadata,120000);
        }
        if(entry.session.drawing)saved=entry.session.drawing;
        else{
          await update({phase:'Uploading directly to Google Drive…'});
          const result=await transferDrawingToDrive(entry,entry.file,progress=>{update({progress,phase:'Uploading drawing to Google Drive…'});});
          entry.completion=result;
          await update({progress:100,phase:'File uploaded · saving drawing register…'});
          saved=await uploadApiRequest('finishReceivedUpload',{completionTicket:result.completionTicket},120000);
        }
      if(generation!==AUTH_SESSION_GENERATION)return;
      const newIntake={id:saved.drawingId,projectId:metadata.projectId,floor:metadata.floors.join(', '),floors:metadata.floors,zone:'',areas:[],drawingType:canonicalDrawingType(metadata.drawingType),fileName:metadata.fileName,driveUrl:saved.driveUrl||'',driveFileId:saved.driveFileId||'',mimeType:metadata.mimeType,note:metadata.notes,date:saved.receivedSentDate||metadata.receivedSentDate,uploadedAt:saved.createdAt||new Date().toISOString(),classified:saved.classified===true||String(saved.classified)==='true',source:'Received Upload'};
      await persist(latest=>({...latest,intakes:[newIntake,...(latest.intakes||[]).filter(i=>i.id!==newIntake.id)],pendingReceivedUploads:(latest.pendingReceivedUploads||[]).filter(j=>j.id!==job.id)}));
      RECEIVED_UPLOAD_JOBS.delete(job.id);
    }catch(e){
      if(/session.*expired|invalid or expired/i.test(e.message)){entry.session=null;entry.completion=null;entry.transferStarted=false;entry.directFailed=false;}
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
function UploadView({ state, persist, initialFile=null, initialProjectId, compact=false, onQueued, hideProjectPicker=false }) {
  // Keep this helper local: ProjectsView has its own helper that is not in scope here.
  const uploadProjectIsCompleted = p =>
    p?.status === "Completed" ||
    p?.projectControl?.projectStatus === "Completed" ||
    Boolean(p?.completedAt);
  const activeProjects=(state.projects||[]).filter(p=>!uploadProjectIsCompleted(p));
  const [projectId, setProjectId] = useState(initialProjectId||activeProjects[0]?.id || "");
  const [floors, setFloors] = useState([]);
  const [drawingType, setDrawingType] = useState(canonicalDrawingType((state.templates||DEFAULT_TEMPLATES)[0]?.drawingType || "Layout"));
  const [file, setFile] = useState(initialFile);
  const [note, setNote] = useState("");
  const [receivedDate,setReceivedDate]=useState(todayISO);
  const validReceivedDate=/^\d{4}-\d{2}-\d{2}$/.test(receivedDate)&&!isNaN(Date.parse(receivedDate))&&new Date(receivedDate).toISOString().slice(0,10)===receivedDate&&receivedDate<=todayISO();
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
    if(!projectId||!floors.length||!drawingType||!file||!validReceivedDate||submitLock.current)return;
    if(!file.size){alert('Choose a non-empty drawing file.');return;}
    submitLock.current=true;
    const metadata={projectId,floor:floors.join(', '),floors:[...floors],area:'',drawingType,fileName:file.name,mimeType:file.type||'application/octet-stream',fileSize:file.size,fileLastModified:file.lastModified,notes:note,receivedSentDate:receivedDate};
    const duplicate=(state.pendingReceivedUploads||[]).some(j=>j.metadata.projectId===projectId&&String(j.metadata.fileName||'').trim().toLowerCase()===file.name.trim().toLowerCase()&&j.metadata.fileSize===file.size&&[...(j.metadata.floors||[])].sort().join('|')===[...floors].sort().join('|')&&j.metadata.drawingType===drawingType&&j.metadata.receivedSentDate===receivedDate&&(!j.metadata.fileLastModified||j.metadata.fileLastModified===file.lastModified)&&RECEIVED_UPLOAD_JOBS.get(j.id)?.file===file);
    if(duplicate){submitLock.current=false;alert('This drawing is already in the upload queue. Use its Retry button if needed.');return;}
    const job={id:'DRW-UPL-'+crypto.randomUUID(),metadata,ownerEmail:state.currentUser?.email||'',status:'queued',phase:'Waiting to upload…',progress:0};
    const selectedFile=file;
    const savedLocally=persist(latest=>({...latest,pendingReceivedUploads:[...(latest.pendingReceivedUploads||[]),job]}));
    setSaving(true);
    Promise.resolve(savedLocally).then(()=>{setFile(null);setNote('');setReceivedDate(todayISO());if(fileRef.current)fileRef.current.value='';setJustAdded(true);if(!compact)setTimeout(()=>setJustAdded(false),2200);submitLock.current=false;setSaving(false);runReceivedUploadJob(persist,job,selectedFile);onQueued?.(projectId);}).catch(e=>{submitLock.current=false;setSaving(false);alert(e.message);});
  };

  const pending = (state.intakes||[]).filter((i) => !i.classified);

  return (
    <div style={{ display: "grid", gridTemplateColumns: compact?"1fr":"1fr 1fr", gap: compact?0:32 }}>
      <div>
        {!compact&&<h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, margin: "4px 0 18px", color: T.ink }}>Received — Upload</h2>}
        <div style={{display:hideProjectPicker?"none":"block"}}><Field label="Project">
          <ProjectStatusSelect projects={activeProjects} style={inputStyle} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {activeProjects.map((p) => <option key={p.id} value={p.id}>{p.no} — {p.name}</option>)}
          </ProjectStatusSelect>
        </Field></div>

        <Field label="Received Date"><input aria-label="Drawing received date" type="date" required max={todayISO()} disabled={saving} value={receivedDate} onChange={e=>setReceivedDate(e.target.value)} style={inputStyle}/><div style={{fontSize:11,color:T.inkDim,marginTop:5}}>Date the drawing arrived by email, WhatsApp or another source.</div>{!validReceivedDate&&<div role="alert" style={{fontSize:11,color:T.redline,marginTop:4}}>Choose a valid received date on or before today.</div>}</Field>

        <Field label="Floors in this drawing — select all that apply">
          <div style={{display:'flex',flexWrap:'wrap',gap:12,padding:12,border:`1px solid ${T.line}`,fontFamily:FONT_BODY,fontSize:12,color:T.ink}}>{availableFloors.map(f=><label key={f} style={{display:'inline-flex',alignItems:'center',gap:4}}><input type="checkbox" aria-label={`Upload floor ${f}`} checked={floors.includes(f)} disabled={saving} onChange={e=>setFloors(current=>e.target.checked?[...new Set([...current,f])]:current.filter(x=>x!==f))}/> {f}</label>)}</div>
          <div style={{fontSize:12,color:T.inkDim,marginTop:6}}>{floors.length?`${floors.length} floor(s) tagged: ${floors.join(', ')}`:'Select at least one floor. One file can cover several floors.'}</div>
          {project && availableFloors.length===0 && <div style={{fontSize:11,color:T.redline,marginTop:5}}>No floors selected for this project in Projects & Scope.</div>}
        </Field>

        <Field label="Drawing file">
          <div style={{...inputStyle,padding:8,display:'flex',alignItems:'center',gap:10,minWidth:0}}><button type="button" disabled={saving} style={{...smallBtn,flexShrink:0}} onClick={()=>fileRef.current?.click()}>Choose File</button><span aria-live="polite" aria-label="Selected drawing filename" title={file?.name||'No file chosen'} style={{fontFamily:FONT_BODY,fontSize:12,overflowWrap:'anywhere'}}>{file?.name||'No file chosen'}</span><input ref={fileRef} type="file" aria-label="Choose drawing file" tabIndex={-1} style={{display:'none'}} disabled={saving} onChange={e=>{const selected=e.target.files?.[0];if(selected)setFile(selected);}}/></div>
          {file&&<div style={{fontFamily:FONT_MONO,fontSize:11,marginTop:6,color:T.inkDim}}>Format: {drawingFileType({fileName:file.name})}</div>}
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
        <Btn onClick={submit} disabled={!file||!floors.length||!validReceivedDate||saving}>
          <Upload size={14} /> {saving?"Uploading to Google Drive…":"Log received drawing"}
        </Btn>
        {justAdded && <div style={{ marginTop: 12, fontFamily: FONT_MONO, fontSize: 12, color: T.green }}>Added to the upload queue. It will appear for classification after Google Drive and Sheets confirm the save.</div>}
      </div>

      {!compact&&<div>
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
      </div>}
    </div>
  );
}

/* ---------------------------------------------------------------
   VIEW: CLASSIFY (Stage 2 — zone letters + drawing type -> tasks)
--------------------------------------------------------------- */
function classifyDrawingPreviewInfo(row){
  const type=drawingFileType(row||{});let original='',id='',resource='';
  try{const url=new URL(row?.driveUrl||'');if(url.protocol==='https:'&&url.hostname==='drive.google.com'){original=url.href;id=url.pathname.match(/\/file\/d\/([\w-]+)/)?.[1]||url.searchParams.get('id')||'';resource=url.searchParams.get('resourcekey')||'';}}catch{}
  if(!id&&/^[\w-]{5,200}$/.test(String(row?.driveFileId||'')))id=row.driveFileId;
  if(!/^[\w-]{5,200}$/.test(id))id='';
  if(id&&!original)original=`https://drive.google.com/file/d/${id}/view`;
  const suffix=resource?'?resourcekey='+encodeURIComponent(resource):'';
  return {type,original,preview:id?`https://drive.google.com/file/d/${id}/preview${suffix}`:'',download:id?`https://drive.google.com/uc?export=download&id=${id}${resource?'&resourcekey='+encodeURIComponent(resource):''}`:'',canPreview:['PDF','JPEG','PNG','GIF','WEBP','BMP','TIFF','TIF','DXF'].includes(type),cad:['DWG','DWT','DWF'].includes(type)};
}
let autodeskSdkPromise;
function loadAutodeskSdk(){
 if(window.Autodesk?.Viewing)return Promise.resolve();
 if(!autodeskSdkPromise)autodeskSdkPromise=new Promise((resolve,reject)=>{if(!document.getElementById('enlighten-aps-css')){const css=document.createElement('link');css.id='enlighten-aps-css';css.rel='stylesheet';css.href='https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css';document.head.appendChild(css);}const script=document.createElement('script');script.src='https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js';script.onload=()=>resolve();script.onerror=()=>{script.remove();autodeskSdkPromise=null;reject(Error('Autodesk viewer could not load. Check your connection and retry.'));};document.head.appendChild(script);});return autodeskSdkPromise;
}
function AutodeskDrawingPreview({drawing}){
 const info=classifyDrawingPreviewInfo(drawing),driveFileId=drawing.driveFileId||info.original.match(/\/file\/d\/([\w-]+)/)?.[1]||'';
 const [status,setStatus]=useState('checking'),[message,setMessage]=useState('Checking for a prepared CAD preview…'),[run,setRun]=useState(0);
 const container=useRef(null),viewer=useRef(null),generation=useRef(0);
 useEffect(()=>{const gen=++generation.current;let stopped=false,timer;setStatus('checking');setMessage(run>0?'Sending the selected drawing securely to Autodesk…':'Checking for a prepared CAD preview…');
   const alive=()=>!stopped&&gen===generation.current;
   const payload={projectId:drawing.projectId,driveFileId};
   const show=async result=>{await loadAutodeskSdk();if(!alive())return;
     window.Autodesk.Viewing.Initializer({env:'AutodeskProduction2',api:'streamingV2',getAccessToken:async callback=>{try{const fresh=await apiRequest('cadViewerToken',payload,'GET',90000);if(!fresh.accessToken)throw Error('The preview version changed. Refresh the drawing and retry.');if(alive())callback(fresh.accessToken,fresh.expiresIn);}catch(e){if(alive()){setStatus('error');setMessage(e.message);}}}},()=>{if(!alive()||!container.current)return;const instance=new window.Autodesk.Viewing.GuiViewer3D(container.current,{extensions:['Autodesk.DocumentBrowser']});viewer.current=instance;const code=instance.start();if(code){setStatus('error');setMessage('WebGL viewer could not start. Check browser hardware acceleration.');return;}window.Autodesk.Viewing.Document.load('urn:'+result.urn,doc=>{if(!alive())return;const node=doc.getRoot().getDefaultGeometry();if(!node){setStatus('error');setMessage('No viewable layout was found in this drawing.');return;}instance.loadDocumentNode(doc,node).then(()=>{if(alive()){setStatus('ready');setMessage('');}}).catch(()=>{if(alive()){setStatus('error');setMessage('The drawing preview could not be displayed. Retry or open the original.');}});},()=>{if(alive()){setStatus('error');setMessage('Autodesk could not load the prepared drawing. Check APS setup and retry.');}});});
   };
   const check=async prepare=>{try{const result=await apiRequest(prepare?'cadPrepare':'cadStatus',payload,prepare?'POST':'GET',prepare?290000:90000);if(!alive())return;setStatus(result.status);setMessage(result.message||'');if(result.status==='ready'){setStatus('loading');setMessage('Opening drawing…');await show(result);}else if(result.status==='processing')timer=setTimeout(()=>check(false),5000);}catch(e){if(alive()){setStatus('error');setMessage(e.message);}}};
   check(run>0);return()=>{stopped=true;clearTimeout(timer);viewer.current?.finish();viewer.current=null;};
 },[drawing.projectId,driveFileId,run]);
 return <div style={{padding:12}}><div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:10}}>{!['checking','processing','loading','ready'].includes(status)&&<button type="button" style={{...smallBtn,background:T.navy,color:'#fff'}} onClick={()=>setRun(n=>n+1)}>{status==='not-prepared'?'View CAD drawing':'Retry CAD preview'}</button>}{status==='ready'&&<button type="button" style={smallBtn} onClick={()=>viewer.current?.fitToView()}>Fit drawing</button>}{message&&<span role={status==='error'||status==='failed'?'alert':'status'} style={{fontSize:12,color:status==='error'||status==='failed'?T.redline:T.inkDim}}>{message}</span>}</div>{status==='not-prepared'&&<p style={{fontSize:11,color:T.inkDim}}>The selected drawing will be sent securely from Drive to Autodesk for preview processing. Subsequent openings reuse the prepared preview.</p>}<div ref={container} aria-label="Autodesk CAD drawing viewer" style={{position:'relative',width:'100%',height:status==='ready'||status==='loading'?'min(70vh,650px)':0,minHeight:status==='ready'||status==='loading'?360:0,overflow:'hidden'}}/></div>;
}

function ClassifyDrawingPreview({drawing}){
  const [open,setOpen]=useState(true),[failed,setFailed]=useState(false);
  const info=classifyDrawingPreviewInfo(drawing);
  return <section aria-label="Attached drawing preview" style={{border:`1px solid ${T.line}`,background:'#fff',marginBottom:20,fontFamily:FONT_BODY}}><div style={{display:'flex',gap:10,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',padding:'10px 12px',background:'#D2CDC1'}}><strong style={{fontSize:12}}>Drawing preview · {info.type}</strong><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>{info.original&&<a href={info.original} target="_blank" rel="noreferrer" style={smallBtn}>Open {info.type}</a>}{info.download&&<a href={info.download} target="_blank" rel="noreferrer" style={smallBtn}>Download</a>}{info.canPreview&&info.preview&&<button type="button" style={smallBtn} aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{open?'Hide preview':'Show preview'}</button>}</div></div>
  {!info.original?<p style={{fontSize:12,padding:12,color:T.inkDim}}>No saved file link is available for this drawing yet.</p>:info.cad?<AutodeskDrawingPreview key={drawing.driveFileId||drawing.id} drawing={drawing}/>:info.canPreview&&info.preview?open&&<><iframe key={info.preview} title={`Preview ${drawing.fileName||info.type}`} src={info.preview} loading="lazy" allowFullScreen referrerPolicy="no-referrer" onError={()=>setFailed(true)} style={{display:'block',width:'100%',height:'min(65vh,620px)',minHeight:320,border:0}}/><p style={{fontSize:11,color:T.inkDim,padding:'8px 12px',margin:0}}>{failed?'Preview could not load. ':''}If the preview is unavailable, use Open {info.type} above with your Google account.</p></>:<p style={{fontSize:12,padding:12,color:T.inkDim}}>Use Open {info.type} to view this attachment.</p>}
  </section>;
}

function ClassifyView({ state, persist }) {
  const pending = state.intakes.filter((i) => !i.classified);
  const [selectedId, setSelectedId] = useState(pending[0]?.id || null);
  const [zones, setZones] = useState([]);
  const [drawingType, setDrawingType] = useState(state.templates[0]?.drawingType || "");
  const [done, setDone] = useState(false);
  const [parts,setParts]=useState([]),[saving,setSaving]=useState(false);

  useEffect(() => {
    if (!selectedId && pending.length) setSelectedId(pending[0].id);
    if (selectedId && !pending.find((p) => p.id === selectedId)) setSelectedId(pending[0]?.id || null);
    setZones([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending.length]);

  useEffect(() => {
    const selected = state.intakes.find((i) => i.id === selectedId);
    if (selected?.drawingType) setDrawingType(canonicalDrawingType(selected.drawingType));
    setZones([]);setParts([]);
  }, [selectedId]);

  const toggleZone = (z) => setZones((zs) => zs.includes(z) ? zs.filter((x) => x !== z) : [...zs, z]);

  const intake = state.intakes.find((i) => i.id === selectedId);
  const lockedDrawingType = canonicalDrawingType(drawingType || intake?.drawingType);
  const baseProject = intake && state.projects.find((p) => p.id === intake.projectId);
  const project = baseProject ? {...baseProject,zones:{...(baseProject.zones||{}),...Object.fromEntries((baseProject.floorZones||[]).filter(z=>z.zoneCode).map(z=>[z.zoneCode,{floor:z.floor,room:z.area||z.room}]))}} : null;
  const letters = project ? sortedZoneLetters(project) : [];
  const floors=[...new Set(letters.map(z=>project.zones[z]?.floor).filter(Boolean))];
  const toggleFloor=(floor,checked)=>{const ids=letters.filter(z=>project.zones[z]?.floor===floor);setZones(current=>checked?[...new Set([...current,...ids])]:current.filter(z=>!ids.includes(z)));};

  const submit = async () => {
    if (!selectedId || saving || (!parts.length&&zones.length===0) || !lockedDrawingType) return;
    const entries=[...parts,...(zones.length?[{drawingType:lockedDrawingType,zones:[...zones]}]:[])];setSaving(true);
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
      const savedTasks=[];const savedDrawings=[];
      for(const entry of entries){const coverage=entry.zones.map(z=>({floor:project.zones?.[z]?.floor||intake.floor,area:project.zones?.[z]?.room||z}));
        const result=await projectApi.classifyDrawing({drawingId:selectedId,projectId:project.id,drawingType:entry.drawingType,coverage});
        savedTasks.push(...(result?.tasks||[]));savedDrawings.push(...(result?.drawings||[]));
      }
      const saved={tasks:savedTasks};const allZones=[...new Set(entries.flatMap(e=>e.zones))],areaNames=allZones.map(z=>project.zones?.[z]?.room||z);
      const backendTasks = Array.isArray(saved?.tasks) ? saved.tasks.map(t => ({
        id:t.designTaskId||uid(), designTaskId:t.designTaskId, designNo:t.designNo,
        projectId:project.id, projectName:project.name, zones:[t.area||""], drawingType:t.dependencyDrawingType||lockedDrawingType,
        title:t.taskType||t.title||"Design Task", assignee:t.assigneeName||"", status:t.status||STATUS.TODO,
        date:todayISO(), hours:Number(t.actualHours||0), sourceFile:intake.fileName
      })) : newTasks;
      const nextIntakes = state.intakes.map((i) => i.id === selectedId ? { ...i, classified: true, zones:allZones, classifications:entries, floors:[...new Set(allZones.map(z=>project.zones[z].floor))], coverage:allZones.map(z=>({floor:project.zones[z].floor,area:project.zones[z].room||z})), areas:areaNames, drawingType:lockedDrawingType } : i);
      await persist({ ...state, intakes: nextIntakes, tasks: [...new Map([...state.tasks,...backendTasks].map(t=>[t.designTaskId||t.id,t])).values()] });
    } catch(err) {
      alert(`Classification could not finish: ${err?.message||err}. Your selections are retained; retry to finish the remaining entries.`);setSaving(false); return;
    }
    setZones([]);setParts([]);setSaving(false); setDone(true);
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
    <div style={{ display: "grid", gridTemplateColumns: "260px minmax(0,1fr)", gap: 28 }}>
      <div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: T.inkDim, marginBottom: 10 }}>Pending drawings</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {pending.map((i) => {
            const p = state.projects.find((pr) => pr.id === i.projectId);
            const active = i.id === selectedId;
            return (
              <button key={i.id} disabled={saving} onClick={() => { setSelectedId(i.id); setZones([]); }} style={{
                minWidth:0,width:"100%",boxSizing:"border-box",overflowWrap:"anywhere",whiteSpace:"normal",textAlign: "left", padding: "10px 12px", borderRadius: 6, cursor: "pointer",
                border: `1px solid ${active ? T.blue : T.line}`, background: active ? "#EAF1FB" : "#fff",
              }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: T.ink,overflowWrap:"anywhere",wordBreak:"break-word",whiteSpace:"normal" }}>{i.fileName}</div>
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
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.inkDim, marginBottom: 20,overflowWrap:"anywhere" }}>{intake?.fileName} · Uploaded {fmtDateTime(intake?.uploadedAt || intake?.createdAt || intake?.date)}</div>

        {intake&&<ClassifyDrawingPreview key={intake.id} drawing={intake}/>}

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

        <Field label="Drawing type for this part of the file">
          <select aria-label="Classification drawing type" style={inputStyle} disabled={saving} value={lockedDrawingType} onChange={e=>setDrawingType(e.target.value)}>{[...new Set([lockedDrawingType,...state.templates.map(t=>canonicalDrawingType(t.drawingType))])].filter(Boolean).map(type=><option key={type} value={type}>{type}</option>)}</select>
        </Field>
        {parts.length>0&&<div style={{marginBottom:14,fontFamily:FONT_BODY,fontSize:12}}>{parts.map((entry,index)=><div key={index} style={{padding:10,border:`1px solid ${T.line}`,marginBottom:6,overflowWrap:'anywhere'}}><strong>{entry.drawingType}</strong> · {entry.zones.map(z=>`${project.zones[z]?.floor} · ${project.zones[z]?.room||z}`).join('; ')} <button style={smallBtn} disabled={saving} onClick={()=>setParts(rows=>rows.filter((_,i)=>i!==index))}>Remove part</button></div>)}</div>}
        <button type="button" style={{...smallBtn,marginBottom:14}} disabled={saving||!zones.length} onClick={()=>{setParts(rows=>[...rows,{drawingType:lockedDrawingType,zones:[...zones]}]);setZones([]);}}>Add another drawing type / part</button>
        <p style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim}}>Each part has its own type and floor/area selection. All parts use the same uploaded file; their work is tracked separately.</p>

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

        <Btn onClick={submit} disabled={saving||(!zones.length&&!parts.length)}>
          <ClipboardCheck size={14} /> {saving?"Saving classifications…":"Save all parts & open tasks"}
        </Btn>
        {done && <div style={{ marginTop: 12, fontFamily: FONT_MONO, fontSize: 12, color: T.green }}>Tasks created and assigned.</div>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   VIEW: TIMESHEET
--------------------------------------------------------------- */
function wihAddDays(date,days){return new Date(Date.parse(date+'T00:00:00Z')+Number(days)*86400000).toISOString().slice(0,10);}
function wihLocalDate(date){const d=new Date(date);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function wihLocalInput(date){const d=new Date(date);return `${wihLocalDate(d)}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}
async function syncWihCalendarEvent(token,task,plan,email){
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(location.origin+'|'+email.toLowerCase()+'|'+task.designTaskId));
 const id='en'+Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
 const event={summary:`${/completed|^done$/i.test(task.status)?'✓ ':''}${task.projectName} · ${task.floor||''}–${task.drawingType||''} · ${task.title}`,description:`enLIGHTen Work in Hand\nDrawing: ${task.receipt?.fileName||''}\nArea: ${task.area||'Whole floor'}\nReceived: ${plan.receivedDate}\nTAT: ${plan.tatDays} calendar days\nInternal due: ${plan.internalDueDate}\nSuggested client date (+1 day): ${plan.clientDueDate}\nStatus: ${task.status}\nEdit the schedule in enLIGHTen and sync again. Calendar changes do not update WIH.`,start:{dateTime:plan.plannedStart,timeZone:plan.timeZone},end:{dateTime:plan.plannedEnd,timeZone:plan.timeZone},extendedProperties:{private:{enlightenTaskId:String(task.designTaskId)}},visibility:'private',transparency:'opaque'};
 const base='https://www.googleapis.com/calendar/v3/calendars/primary/events',headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
 let response=await fetch(base+'/'+id+'?sendUpdates=none',{method:'PATCH',headers,body:JSON.stringify(event)});
 if(response.status===404){response=await fetch(base+'?sendUpdates=none',{method:'POST',headers,body:JSON.stringify({id,...event})});if(response.status===409)response=await fetch(base+'/'+id+'?sendUpdates=none',{method:'PATCH',headers,body:JSON.stringify(event)});}
 if(!response.ok){const error=await response.json().catch(()=>({}));throw Error(error.error?.message||'Google Calendar sync failed. Reconnect and retry.');}return response.json();
}
function wihUrgency(task,now=Date.now()){
 const done=/completed|^done$/i.test(task.status);if(done)return {urgent:false,label:''};
 if(task.plan?.internalDueDate&&task.plan.internalDueDate<wihLocalDate(new Date(now)))return {urgent:true,label:'URGENT · deadline passed'};
 // Missing TAT is not a missed delivery deadline; late entry is tracked separately for review.
 return {urgent:false,label:''};
}
function wihPerformanceReport(tasks,quarter='all'){
 const day=(value,tz)=>{if(!value)return '';const d=new Date(value);if(isNaN(d))return '';try{return new Intl.DateTimeFormat('en-CA',{timeZone:tz||'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);}catch{return d.toISOString().slice(0,10);}};
 const quarterOf=value=>{const match=String(value).match(/^(\d{4})-(\d{2})/);return match?match[1]+'-Q'+(Math.floor((Number(match[2])-1)/3)+1):'';};
 const rows=tasks.filter(t=>/completed|^done$/i.test(t.status)&&!/^Skipped:/i.test(t.task?.remarks||'')).map(t=>{
  const completed=day(t.task?.completedAt||t.stopAt,t.plan?.timeZone),due=String(t.plan?.internalDueDate||'').slice(0,10);
  const hours=Number(t.task?.actualHours)>0?Number(t.task.actualHours):Number(t.hours)>0?Number(t.hours):null;
  return {...t,completedDate:completed,performanceQuarter:quarterOf(completed),actualWorkHours:hours,outcome:!completed||!due?'Unrated':completed>due?'Delayed':'On time',delayDays:completed&&due?Math.max(0,Math.round((Date.parse(completed)-Date.parse(due))/86400000)):null};
 }).filter(t=>quarter==='all'||t.performanceQuarter===quarter);
 const timed=rows.filter(t=>t.actualWorkHours!==null),rated=rows.filter(t=>t.outcome!=='Unrated'),groups=new Map();
 rows.forEach(t=>{const key=String(t.title||'Task').trim();if(!groups.has(key))groups.set(key,[]);groups.get(key).push(t);});
 const groupsReport=[...groups].map(([title,list])=>{const timed=list.filter(t=>t.actualWorkHours!==null).sort((a,b)=>a.actualWorkHours-b.actualWorkHours);return {title,count:list.length,onTime:list.filter(t=>t.outcome==='On time').length,delayed:list.filter(t=>t.outcome==='Delayed').length,lowest:timed[0]||null,highest:timed.at(-1)||null,average:timed.length?timed.reduce((a,t)=>a+t.actualWorkHours,0)/timed.length:null};});
 return {rows,groups:groupsReport,total:rows.length,onTime:rows.filter(t=>t.outcome==='On time').length,delayed:rows.filter(t=>t.outcome==='Delayed').length,unrated:rows.length-rated.length,onTimeRate:rated.length?100*rows.filter(t=>t.outcome==='On time').length/rated.length:null,average:timed.length?timed.reduce((a,t)=>a+t.actualWorkHours,0)/timed.length:null,lowest:timed.sort((a,b)=>a.actualWorkHours-b.actualWorkHours)[0]||null,highest:timed.at(-1)||null};
}
function PerformanceView({state}){
 const [rows,setRows]=useState([]),[busy,setBusy]=useState(true),[error,setError]=useState(''),[employee,setEmployee]=useState(String(state.currentUser?.userId||'')),[revision,setRevision]=useState(0);
 const generation=useRef(0),admin=state.currentUser?.appAccess?.toLowerCase()==='admin',manager=admin||(state.projects||[]).some(p=>state.currentUser?.appAccess?.toLowerCase()!=='viewer'&&projectRole(state,p.id)==='Admin');
 useEffect(()=>{const n=++generation.current;setBusy(true);setError('');projectApi.getWIH(true).then(data=>{if(n!==generation.current)return;setRows(Array.isArray(data)?data:data?.rows||[]);}).catch(e=>{if(n===generation.current)setError(e.message||'Could not load performance.');}).finally(()=>{if(n===generation.current)setBusy(false);});return()=>{generation.current++;};},[revision,state.currentUser?.userId]);
 const projectIds=new Set((state.projects||[]).map(p=>String(p.id)));
 const accessible=rows.filter(r=>projectIds.has(String(r.projectId))&&(admin||projectRole(state,r.projectId)&&(state.currentUser?.appAccess?.toLowerCase()!=='viewer'&&projectRole(state,r.projectId)==='Admin'||String(r.assigneeUserId)===String(state.currentUser?.userId))));
 const members=[...new Map(accessible.map(r=>[String(r.assigneeUserId||''),r.assigneeName||r.task?.assigneeName||'Unassigned'])).entries()];
 const selected=manager?employee:String(state.currentUser?.userId||'');
 const tasks=accessible.filter(r=>selected==='all'||String(r.assigneeUserId||'')===selected).map(r=>({...r,title:r.task?.taskType||'Design Task',projectName:(state.projects||[]).find(p=>String(p.id)===String(r.projectId))?.name||r.task?.projectName||'',floor:r.task?.floor||'',area:r.task?.area||'',assignee:r.assigneeName||r.task?.assigneeName||'',hours:Number(r.totalMinutes||0)/60,status:String(r.status||r.task?.status||'Not Started')}));
 return <div><div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',marginBottom:18}}>{manager&&<label style={{fontSize:12}}>Team member <select aria-label="Performance team member" value={employee} onChange={e=>setEmployee(e.target.value)} style={{...inputStyle,width:'auto'}}><option value="all">All accessible members</option>{!members.some(([id])=>id===String(state.currentUser?.userId))&&<option value={String(state.currentUser?.userId||'')}>{state.currentUser?.name||'My performance'}</option>}{members.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>}<button style={smallBtn} disabled={busy} onClick={()=>setRevision(n=>n+1)}>Refresh performance</button>{busy&&<span role="status">Updating performance…</span>}</div>{error&&<p role="alert" style={{fontSize:12,color:T.redline}}>{error}</p>}<WihPerformance tasks={tasks} person="All" currentUser={state.currentUser} reportTitle={selected==='all'?'Accessible team':members.find(([id])=>id===selected)?.[1]||state.currentUser?.name||'My performance'}/></div>;
}
function WihPerformance({tasks,person,currentUser,reportTitle}){
 const now=new Date(),currentQuarter=now.getFullYear()+'-Q'+(Math.floor(now.getMonth()/3)+1);
 const [quarter,setQuarter]=useState(currentQuarter);
 const scoped=tasks.filter(t=>person==='All'||t.assignee===person),all=wihPerformanceReport(scoped),report=wihPerformanceReport(scoped,quarter);
 const quarters=[...new Set([currentQuarter,...all.rows.map(t=>t.performanceQuarter).filter(Boolean)])].sort().reverse();
 const hours=n=>n===null||n===undefined?'—':n.toFixed(2)+' h';
 const th={padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:600,background:'#D2CDC1',borderBottom:`1px solid ${T.line}`,whiteSpace:'nowrap'},td={padding:'9px 12px',fontSize:12,borderBottom:`1px solid ${T.line}`,verticalAlign:'top'};
 const detail=t=>t?<><strong>{hours(t.actualWorkHours)}</strong><div style={{fontSize:11,color:T.inkDim,marginTop:4}}>{t.projectName} · {t.floor||'—'} · {t.area||'—'} · {t.assignee||'Unassigned'}</div></>:'—';
 const exportReport=()=>{const values=[['Project','Task','Person','Floor','Area','Completed date','Original deadline','Result','Delay days','Actual work hours'],...report.rows.map(t=>[t.projectName,t.title,t.assignee,t.floor,t.area,t.completedDate,t.plan?.internalDueDate||'',t.outcome,t.delayDays??'',t.actualWorkHours??''])];const csv=values.map(row=>row.map(v=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='enLIGHTen-performance-'+quarter+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 return <section style={{fontFamily:FONT_BODY}}><div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:12}}><h3 style={{fontFamily:FONT_DISPLAY,fontSize:20,margin:0}}>Performance · {reportTitle||(person==='All'?'Accessible team':person||currentUser?.name)}</h3><label style={{fontSize:12,marginLeft:'auto'}}>Period <select aria-label="Performance period" style={{...inputStyle,width:'auto'}} value={quarter} onChange={e=>setQuarter(e.target.value)}><option value="all">All time</option>{quarters.map(q=><option key={q}>{q}</option>)}</select></label><button style={smallBtn} disabled={!report.total} onClick={exportReport}>Download report</button></div><p style={{fontSize:12,color:T.inkDim}}>Completed work is grouped by completion quarter. On time means completed by the original locked TAT deadline. Work time excludes recorded pauses; it is not elapsed calendar time.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,margin:'16px 0'}}>{[['Completed',report.total],['On time',report.onTime],['Delayed',report.delayed],['Missing deadline / date',report.unrated],['On-time rate',report.onTimeRate===null?'—':report.onTimeRate.toFixed(1)+'%'],['Average work time',hours(report.average)]].map(([label,value])=><div key={label} style={{background:T.paper,border:`1px solid ${T.line}`,padding:14}}><div style={{fontSize:11,color:T.inkDim}}>{label}</div><strong style={{display:'block',fontSize:24,marginTop:6,color:T.navy}}>{value}</strong></div>)}</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:12,marginBottom:20}}>{[['Lowest task time',report.lowest],['Highest task time',report.highest]].map(([label,t])=><div key={label} style={{padding:14,border:`1px solid ${T.line}`,fontSize:12}}><div style={{color:T.inkDim,marginBottom:6}}>{label}</div>{t&&<div style={{marginBottom:5}}>{t.title}</div>}{detail(t)}</div>)}</div><h4 style={{fontSize:14}}>Task time comparison</h4><div style={{overflowX:'auto'}}><table style={{borderCollapse:'collapse',width:'100%',minWidth:700}}><thead><tr>{['Task','Completed','On time','Delayed','Lowest time','Highest time','Average'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{report.groups.map(g=><tr key={g.title}><td style={td}>{g.title}</td><td style={td}>{g.count}</td><td style={td}>{g.onTime}</td><td style={td}>{g.delayed}</td><td style={td}>{detail(g.lowest)}</td><td style={td}>{detail(g.highest)}</td><td style={td}>{hours(g.average)}</td></tr>)}</tbody></table></div><p style={{fontSize:11,color:T.inkDim}}>Compare similar scope and floor/area before interpreting lowest and highest times. Skipped optional steps are excluded. Missing time is excluded from time statistics; missing deadlines or completion dates are unrated.</p><h4 style={{fontSize:14}}>Completed task details</h4>{!report.total&&<p role="status">No completed work recorded for this period.</p>}<div style={{overflowX:'auto'}}><table style={{borderCollapse:'collapse',width:'100%',minWidth:760}}><thead><tr>{['Project / Task','Person','Original deadline','Completed','Result','Delay','Work time'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{report.rows.map(t=><tr key={t.designTaskId}><td style={td}><strong>{t.projectName}</strong><div>{t.title} · {t.floor} · {t.area}</div></td><td style={td}>{t.assignee||'Unassigned'}</td><td style={td}>{t.plan?.internalDueDate?formatProjectDate(t.plan.internalDueDate):'—'}</td><td style={td}>{t.completedDate?formatProjectDate(t.completedDate):'—'}</td><td style={{...td,color:t.outcome==='Delayed'?T.redline:T.ink}}>{t.outcome}</td><td style={td}>{t.delayDays===null?'—':t.delayDays+' days'}</td><td style={td}>{hours(t.actualWorkHours)}</td></tr>)}</tbody></table></div></section>;
}
function WihPlanner({state,tasks,requestedTask,onSaved,onDismiss,onAction,onComplete,busyId}){
 const [open,setOpen]=useState(true),[selected,setSelected]=useState(''),[draft,setDraft]=useState(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[clientId,setClientId]=useState(''),[connected,setConnected]=useState(false),[week,setWeek]=useState(()=>wihLocalDate(new Date()));
 const calendarAuth=useRef(null),tokenClient=useRef(null);
 const email=String(state.currentUser?.email||'').toLowerCase(),userId=String(state.currentUser?.userId||'');
 const manageable=t=>state.currentUser?.appAccess?.toLowerCase()!=='viewer'&&(projectRole(state,t.projectId)==='Admin'||String(t.assigneeUserId)===userId&&!!userId||state.currentUser?.appAccess?.toLowerCase()==='admin');
 const task=tasks.find(t=>String(t.designTaskId)===String(selected));
 const choose=t=>{setOpen(true);setSelected(String(t.designTaskId));setMessage('');const plan=t.plan;setDraft({tatDays:plan?.tatDays||3,plannedStart:wihLocalInput(plan?.plannedStart||new Date()),hours:plan?.plannedStart&&plan?.plannedEnd?Math.max(.25,(Date.parse(plan.plannedEnd)-Date.parse(plan.plannedStart))/3600000):2});};
 useEffect(()=>{if(typeof document!=='undefined'&&!window.google?.accounts?.oauth2&&!document.getElementById('enlighten-google-login')){const script=document.createElement('script');script.id='enlighten-google-login';script.src='https://accounts.google.com/gsi/client';script.async=true;document.head.appendChild(script);}fetch('/api?action=authConfig',{credentials:'same-origin'}).then(r=>r.json()).then(r=>setClientId(r.data?.clientId||'')).catch(()=>{});return()=>{calendarAuth.current=null;};},[]);
 useEffect(()=>{if(requestedTask)choose(requestedTask);},[requestedTask]);
 const connect=()=>{setMessage('');if(!clientId||!window.google?.accounts?.oauth2){setMessage('Google Calendar setup is unavailable. Check the Google client configuration and reload.');return;}
 tokenClient.current=window.google.accounts.oauth2.initTokenClient({client_id:clientId,scope:'openid email https://www.googleapis.com/auth/calendar.events.owned',login_hint:email,callback:async response=>{try{if(response.error||!response.access_token)throw Error(response.error_description||'Calendar permission was not granted.');if(!window.google.accounts.oauth2.hasGrantedAllScopes(response,'https://www.googleapis.com/auth/calendar.events.owned'))throw Error('Grant Calendar permission to connect.');const result=await fetch('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{Authorization:'Bearer '+response.access_token}});const identity=await result.json();if(!result.ok||String(identity.email||'').toLowerCase()!==email||!identity.email_verified)throw Error('Choose the same Google account used to sign in to enLIGHTen.');calendarAuth.current={token:response.access_token,expires:Date.now()+Number(response.expires_in||3600)*1000};setConnected(true);setMessage('Google Calendar connected. Use Sync my scheduled work, or save a plan to sync it.');}catch(e){calendarAuth.current=null;setConnected(false);setMessage(e.message);}},error_callback:e=>setMessage(e.type==='popup_closed'?'Calendar connection cancelled.':'Allow the Google consent popup and try again.')});tokenClient.current.requestAccessToken({prompt:''});};
 const auth=()=>{const value=calendarAuth.current;if(!value||value.expires<=Date.now()+30000){setConnected(false);calendarAuth.current=null;throw Error('Connect Google Calendar again to sync.');}return value.token;};
 const sync=async()=>{setBusy(true);setMessage('');let count=0;try{const token=auth();for(const t of tasks.filter(t=>String(t.assigneeUserId)===userId&&!!userId&&t.plan?.plannedStart&&t.plan?.plannedEnd)){await syncWihCalendarEvent(token,t,t.plan,email);count++;}setMessage(`${count} work session(s) synced to your Google Calendar.`);}catch(e){setMessage(`${count} session(s) synced. ${e.message}`);}finally{setBusy(false);}};
 const save=async(tatOnly=false)=>{if(!task||!draft||busy)return;setBusy(true);setMessage('');let saved=false;try{const start=new Date(draft.plannedStart),hours=Number(draft.hours);if(!tatOnly&&(isNaN(start)||!hours||hours<=0||hours>24))throw Error('Enter a valid start time and duration of up to 24 hours.');const plan=await apiRequest('saveWihPlan',{designTaskId:task.designTaskId,tatOnly:tatOnly===true,conflictPolicy:draft.conflictPolicy||'reject',tatDays:Number(draft.tatDays),plannedStart:start.toISOString(),plannedEnd:new Date(start.getTime()+hours*3600000).toISOString(),timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone},'POST',120000);saved=true;onSaved(task.designTaskId,plan);if(!tatOnly&&connected&&String(task.assigneeUserId)===userId)await syncWihCalendarEvent(auth(),task,plan,email);setMessage(tatOnly?'TAT saved and locked. Use Align to add a work session to your calendar.':connected&&String(task.assigneeUserId)===userId?'Plan saved and synced.':'Plan saved. Connect Google Calendar to sync your own work.');}catch(e){setMessage((saved?'Plan saved; calendar not synced. ':'')+e.message);}finally{setBusy(false);}};
 const commitments=[...new Set(tasks.map(t=>t.receipt?.drawingId).filter(Boolean))].map(id=>{const work=tasks.filter(t=>t.receipt?.drawingId===id&&!/completed|^done$/i.test(t.status));const dates=work.map(t=>t.plan?.clientDueDate).filter(Boolean).sort();return {id,name:work[0]?.receipt?.fileName,project:work[0]?.projectName,due:dates.at(-1),unplanned:work.filter(t=>!t.plan).length,count:work.length};}).filter(g=>g.count);
 const days=Array.from({length:7},(_,i)=>wihAddDays(week,i));
 const validDate=task?.receipt?.receivedDate&&/^\d{4}-\d{2}-\d{2}$/.test(task.receipt.receivedDate),tat=Number(draft?.tatDays),due=validDate&&Number.isInteger(tat)&&tat>0&&tat<=365?(task.plan?.internalDueDate||wihAddDays(task.receipt.receivedDate,tat)):'';
 return <section style={{fontFamily:FONT_BODY,marginBottom:16}}><div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>{open&&<><button type="button" style={smallBtn} disabled={busy} onClick={connect}>{connected?'Reconnect Google Calendar':'Connect Google Calendar'}</button><button type="button" style={smallBtn} disabled={busy||!connected} onClick={sync}>Sync my scheduled work</button>{connected&&<button type="button" style={smallBtn} onClick={()=>{calendarAuth.current=null;setConnected(false);setMessage('Disconnected in this session. Existing calendar events remain.');}}>Disconnect</button>}</>}</div>{open&&<div style={{padding:16,background:'#fff',border:`1px solid ${T.line}`,marginTop:10}}><p style={{fontSize:12,color:T.inkDim,marginTop:0}}>Enter TAT within 24 hours of task creation. Once saved, TAT and the delivery deadline are locked. Moving a calendar session does not change them. TAT uses calendar days from receipt. Client date = internal due date + 1 day. Calendar sync is one way from WIH to your own Google Calendar; no client messages are sent.</p><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:12}}><button type="button" style={smallBtn} onClick={()=>setWeek(d=>wihAddDays(d,-7))}>Previous week</button><input aria-label="Calendar week" type="date" value={week} style={{...inputStyle,width:170}} onChange={e=>{if(e.target.value)setWeek(e.target.value);}}/><button type="button" style={smallBtn} onClick={()=>setWeek(d=>wihAddDays(d,7))}>Next week</button></div><details open={tasks.some(t=>!t.plan?.plannedStart&&!/completed|^done$/i.test(t.status))} style={{margin:'12px 0',fontSize:12}}><summary style={{cursor:'pointer'}}>Unaligned work</summary>{tasks.filter(t=>!t.plan?.plannedStart&&!/completed|^done$/i.test(t.status)).sort((a,b)=>Number(wihUrgency(b).urgent)-Number(wihUrgency(a).urgent)).map(t=><div key={t.designTaskId} style={{display:'flex',gap:8,alignItems:'center',padding:'8px 0',borderBottom:`1px solid ${T.line}`}}><span style={{flex:1}}>{t.projectName} · {t.title} · {t.floor} {t.area}<span style={{display:'block',fontSize:11,color:wihUrgency(t).urgent?T.redline:T.inkDim}}>{wihUrgency(t).label}</span></span>{manageable(t)&&<button style={smallBtn} onClick={()=>choose(t)}>{t.plan?'Align':'Enter TAT'}</button>}</div>)}</details><details style={{margin:'12px 0',fontSize:12}}><summary style={{cursor:'pointer'}}>Drawing delivery dates for the displayed work</summary>{commitments.map(g=><div key={g.id} style={{padding:'8px 0',borderBottom:`1px solid ${T.line}`}}>{g.project} · {g.name} · {g.due?formatProjectDate(g.due):'TAT not entered'}{g.unplanned?` · Provisional: ${g.unplanned} task(s) still need TAT`:''}</div>)}<p style={{fontSize:11,color:T.inkDim}}>Uses the latest client date across displayed tasks for each received drawing. Check all assigned people and outstanding work before confirming a full drawing delivery.</p></details><div style={{overflowX:'auto'}}><div style={{display:'grid',gridTemplateColumns:'repeat(7,minmax(145px,1fr))',minWidth:1015}}>{days.map(day=><div key={day} style={{border:`1px solid ${T.line}`,minHeight:150,padding:8}}><div style={{fontSize:11,fontWeight:600,marginBottom:8}}>{formatProjectDate(day)}</div>{tasks.filter(t=>t.plan&&wihLocalDate(t.plan.plannedStart)===day).map(t=><div key={t.designTaskId} style={{width:'100%',boxSizing:'border-box',textAlign:'left',padding:8,marginBottom:6,border:0,background:'#E6EEF4',color:T.ink,fontFamily:FONT_BODY,fontSize:11}}><strong>{t.projectName}</strong><div>{t.floor}–{t.drawingType}</div><div>{t.title}</div><div>{new Date(t.plan.plannedStart).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}–{new Date(t.plan.plannedEnd).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})} · {t.assignee}</div><WihDashboardStatus task={t}/>{wihUrgency(t).urgent&&<div style={{color:T.redline,fontWeight:600}}>{wihUrgency(t).label}</div>}<div>TAT {t.plan.tatDays}d · Due {formatProjectDate(t.plan.internalDueDate)}</div><div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:6}}><button style={smallBtn} onClick={()=>choose(t)}>Align</button>{manageable(t)&&!/completed|^done$/i.test(t.status)&&<><button style={smallBtn} disabled={busyId===t.designTaskId||/blocked/i.test(t.status)} onClick={()=>onAction(t,/in progress/i.test(t.status)?'pause':/paused/i.test(t.status)?'resume':'start')}>{/in progress/i.test(t.status)?'Pause':/paused/i.test(t.status)?'Resume':'Start'}</button><button style={smallBtn} disabled={busyId===t.designTaskId||/blocked/i.test(t.status)} onClick={()=>onComplete(t)}>Complete / Upload</button></>}</div></div>)}</div>)}</div></div><label style={{display:'grid',gap:6,fontSize:12,marginTop:14}}>Schedule received-drawing work<select aria-label="Choose work to schedule" value={selected} style={inputStyle} onChange={e=>{const t=tasks.find(t=>String(t.designTaskId)===e.target.value);if(t)choose(t);}}><option value="">Select a task</option>{tasks.filter(t=>manageable(t)).map(t=><option key={t.designTaskId} value={t.designTaskId}>{t.projectName} · {t.floor}–{t.drawingType} · {t.title}</option>)}</select></label>{task&&draft&&<div style={{marginTop:14,padding:14,border:`1px solid ${T.line}`}}><strong style={{fontSize:13}}>{task.title} · {task.floor}–{task.drawingType}</strong><div style={{fontSize:11,color:T.inkDim,marginTop:5}}>Received: {task.receipt?.fileName} · {formatProjectDate(task.receipt?.receivedDate)}</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginTop:12}}><label style={{fontSize:12}}>TAT (calendar days from receipt)<input disabled={!!task.plan} aria-label="Drawing TAT days" type="number" min="1" max="365" value={draft.tatDays} style={inputStyle} onChange={e=>setDraft(d=>({...d,tatDays:e.target.value}))}/></label><label style={{fontSize:12}}>Work session starts<input aria-label="Planned work start" type="datetime-local" value={draft.plannedStart} style={inputStyle} onChange={e=>setDraft(d=>({...d,plannedStart:e.target.value}))}/></label><label style={{fontSize:12}}>Planned hours<input aria-label="Planned work hours" type="number" min="0.25" step="0.25" max="24" value={draft.hours} style={inputStyle} onChange={e=>setDraft(d=>({...d,hours:e.target.value}))}/></label></div><p style={{fontSize:12}}>Internal due: <strong>{due?formatProjectDate(due):'Set a valid received date and TAT'}</strong> · Suggested client date: <strong>{due?formatProjectDate(wihAddDays(due,1)):'—'}</strong>{due&&due<wihLocalDate(new Date())&&<span style={{color:T.redline}}> · Overdue</span>}</p><label style={{display:'block',fontSize:12,marginBottom:12}}>If this slot overlaps other work<select aria-label="Calendar conflict handling" style={inputStyle} value={draft.conflictPolicy||'reject'} onChange={e=>setDraft(d=>({...d,conflictPolicy:e.target.value}))}><option value="reject">Keep other tasks — choose a free slot / postpone this task</option><option value="shift">Extend this slot and shift following tasks</option></select></label><button type="button" disabled={busy||!manageable(task)||/completed|^done$/i.test(task.status)} style={{...smallBtn,background:T.navy,color:'#fff'}} onClick={()=>save(false)}>{busy?'Saving…':task.plan?'Align · keep deadline':'Confirm TAT & align'}</button>{!task.plan&&<button type="button" style={{...smallBtn,marginLeft:8}} disabled={busy||!manageable(task)} onClick={()=>save(true)}>Save TAT only</button>}</div>}{message&&<p role="status" style={{fontSize:12,color:T.inkDim}}>{message}</p>}</div>}</section>;
}

function WihDashboardStatus({task}){
  const status=sheetDashboardStatus([{...task.task,...task,plannedStartDate:task.plan?.plannedStart||task.plannedStartDate,actualStatus:task.status,status:task.status}]);
  const tone=sheetDashboardTone(status);
  return <span title={status==='Pending'?`Not started${task.status?' · '+task.status:''}`:status} style={{display:'inline-flex',alignItems:'center',gap:6,whiteSpace:'nowrap',fontFamily:FONT_BODY,fontSize:11,fontWeight:500,padding:'4px 9px',borderRadius:12,background:tone.bg,color:tone.fg}}><span aria-hidden="true" style={{width:6,height:6,borderRadius:'50%',background:tone.fg,flexShrink:0}}/>{status}</span>;
}

function TechnicalImage({url,label}){const [failed,setFailed]=useState(false);return url&&!failed?<img src={url} alt={label} loading="lazy" onError={()=>setFailed(true)} style={{maxWidth:80,maxHeight:85,objectFit:'contain'}}/>:<span style={{fontSize:10,color:T.inkDim}}>{url?'Image unavailable':'—'}</span>;}
function LocalTechnicalDatabase({state}){
 const [projectId,setProjectId]=useState(''),[tab,setTab]=useState('database'),[seed,setSeed]=useState({fittings:[],lookups:{}}),[overrides,setOverrides]=useState([]),[tables,setTables]=useState([]),[zones,setZones]=useState([]),[selected,setSelected]=useState(''),[version,setVersion]=useState(''),[meta,setMeta]=useState({title:'',floor:'',drawingType:'',revision:''}),[text,setText]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[query,setQuery]=useState(''),[editor,setEditor]=useState(null),[dbLimit,setDbLimit]=useState(60);
 const request=useRef(0),project=(state.projects||[]).find(p=>String(p.id)===String(projectId)),admin=state.currentUser?.appAccess?.toLowerCase()==='admin',canEdit=!!project&&state.currentUser?.appAccess?.toLowerCase()!=='viewer';
 useEffect(()=>{let live=true;(window.__enlightenStandardsPromise||(window.__enlightenStandardsPromise=fetch('/technical-library/database.json').then(r=>{if(!r.ok)throw Error('Fitting database could not load.');return r.json();}).catch(e=>{window.__enlightenStandardsPromise=null;throw e;}))).then(r=>{if(live)setSeed(r);}).catch(e=>{if(live)setMessage(e.message);});apiRequest('listTechnicalFittings',{},'GET',90000).then(r=>{if(live)setOverrides(r);}).catch(e=>{if(live)setMessage(e.message);});return()=>{live=false;};},[]);
 useEffect(()=>{const generation=++request.current;setTables([]);setZones([]);setSelected('');setVersion('');setText('');setMessage('');setMeta({title:'',floor:'',drawingType:'',revision:''});if(!projectId)return;Promise.all([apiRequest('listTechnicalTables',{projectId},'GET',90000),apiRequest('listFloorZones',{projectId},'GET',90000)]).then(([list,areas])=>{if(request.current===generation){setTables(list);setZones(areas);}}).catch(e=>{if(request.current===generation)setMessage(e.message);});},[projectId]);
 const database=React.useMemo(()=>{const map=new Map(seed.fittings.map(f=>[f.id,f]));overrides.forEach(f=>map.set(f.id,f));return [...map.values()];},[seed,overrides]);
 const parsed=React.useMemo(()=>{try{return {rows:parseCadOutput(text),error:''};}catch(e){return {rows:[],error:e.message};}},[text]);
 const technical=React.useMemo(()=>buildTechnicalTable(parsed.rows,database,zones,meta.floor),[parsed.rows,database,zones,meta.floor]);
 const shown=technical.filter(r=>[r.cn,r.zone,r.details,r.control].join(' ').toLowerCase().includes(query.toLowerCase()));const flagged=technical.filter(r=>r.warnings.length);
 const open=async id=>{if(!id)return;const generation=request.current;setBusy(true);setMessage('');try{const saved=await apiRequest('getTechnicalTable',{tableId:id},'GET',90000);if(generation!==request.current)return;setSelected(saved.tableId);setVersion(saved.activeVersion);setMeta({title:saved.title,floor:saved.floor||'',drawingType:saved.drawingType||'',revision:saved.revision||''});setText([TECH_COLUMNS.join('\t'),...saved.rows.map(r=>r.map(v=>/[\t\n"]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v).join('\t'))].join('\n'));setTab('table');}catch(e){setMessage(e.message);}finally{setBusy(false);}};
 const save=async()=>{if(!canEdit||!parsed.rows.length||parsed.error)return;setBusy(true);setMessage('');try{const row=await apiRequest('saveTechnicalTable',{projectId,tableId:selected,expectedVersion:version,...meta,rows:parsed.rows},'POST',120000);setSelected(row.tableId);setVersion(row.activeVersion);setTables(all=>[...all.filter(x=>x.tableId!==row.tableId),row]);setMessage('Output and Technical Table saved.');}catch(e){setMessage(e.message);}finally{setBusy(false);}};
 const saveFitting=async()=>{setBusy(true);try{const fitting=await apiRequest('saveTechnicalFitting',{fitting:editor},'POST',90000);setOverrides(all=>[...all.filter(x=>x.id!==fitting.id),fitting]);setEditor(null);setMessage('Database updated. Technical Tables now use the revised fitting.');}catch(e){setMessage(e.message);}finally{setBusy(false);}};
 const exportCsv=()=>{const safe=v=>{v=String(v??'');if(/^[=+@-]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"';};const fields=['zone','cn','fittingType','details','illuminance','optics','height','colour','control','quantity','unit','totalWattage','bufferedWattage','ip'];const csv=[fields,...technical.map(r=>fields.map(k=>r[k]))].map(row=>row.map(safe).join(',')).join('\r\n');const link=document.createElement('a');link.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));link.download='technical-table.csv';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);};
 const input={...inputStyle,fontFamily:FONT_BODY,fontSize:12};
 const fittingByCode=React.useMemo(()=>new Map([...database].reverse().map(f=>[f.fittingType,f])),[database]);
 return <section className="technical-module" style={{fontFamily:FONT_BODY}}>{message&&<p role="status">{message}</p>}{tab==='database'&&<div><div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',marginBottom:12}}><span style={{fontSize:12,color:T.inkDim}}>{database.length} fitting entries · Standards Database catalogue</span>{admin&&<button type="button" style={smallBtn} onClick={()=>setEditor({id:'fitting-'+uid(),fittingType:'',iconUrl:'',thumbnailUrl:'',brand:'',x:'',pcbWidth:'',standardLengths:'',wattage:''})}>Add fitting</button>}</div>{editor&&<div style={{padding:16,border:`1px solid ${T.line}`,marginBottom:16}}><h3 style={{fontSize:15}}>Edit fitting</h3><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:10}}>{[['fittingType','Fitting type'],['iconUrl','Icon URL'],['thumbnailUrl','Thumbnail URL'],['brand','Brand / IP / Article'],['x','X'],['pcbWidth','PCB width'],['standardLengths','Standard lengths'],['wattage','Wattage (W or W/m)']].map(([k,label])=><label key={k} style={{fontSize:12}}>{label}<input style={{...input,width:'100%'}} value={editor[k]||''} onChange={e=>setEditor(d=>({...d,[k]:e.target.value}))}/></label>)}</div><div style={{display:'flex',gap:10,marginTop:12}}><button type="button" style={smallBtn} disabled={busy} onClick={saveFitting}>Save fitting</button><button type="button" style={smallBtn} disabled={busy} onClick={()=>setEditor(null)}>Cancel</button></div></div>}<div className="standards-catalogue" style={{overflowX:'auto',maxHeight:'75vh',overflowY:'auto',background:T.paper}}><table aria-label="Standards Database catalogue" style={{borderCollapse:'collapse',tableLayout:'fixed',width:seed.catalogue?.widths.reduce((a,b)=>a+b,0)*0.7||2400}}><colgroup>{seed.catalogue?.widths.map((w,i)=><col key={i} style={{width:w*0.7}}/>)}</colgroup><tbody>{seed.catalogue?.rows.map((row,r)=><tr key={r} style={{height:seed.catalogue.heights[r]*0.7,contentVisibility:'auto',containIntrinsicSize:`auto ${seed.catalogue.heights[r]*0.7}px`}}>{row.map((cell,c)=>{if(cell.merged)return null;const fitting=fittingByCode.get(cell.text.trim());const visible=!query||!fitting||[fitting.fittingType,fitting.brand].join(' ').toLowerCase().includes(query.toLowerCase());return <td key={c} rowSpan={cell.span?.[0]||1} colSpan={cell.span?.[1]||1} style={{padding:'3px 5px',border:`1px solid ${T.line}`,background:r===0?'#D2CDC1':T.paper,color:T.ink,verticalAlign:'top',textAlign:c===0?'left':'center',whiteSpace:'pre-line',fontFamily:FONT_BODY,fontSize:Math.max(10,(cell.size||14)*0.7),fontWeight:cell.bold?700:500,opacity:visible?1:0.18}}>{cell.image&&<img loading="lazy" src={cell.image} alt={cell.text||`Luminaire illustration row ${r+1} column ${c+1}`} style={{display:'block',width:'100%',height:Math.max(32,seed.catalogue.heights[r]*0.7-8),objectFit:'contain'}}/>}{fitting&&admin?<button type="button" title="Edit fitting" onClick={()=>setEditor({...fitting})} style={{font:'inherit',color:'inherit',background:'transparent',border:0,padding:0,cursor:'pointer'}}>{cell.text}</button>:cell.text}</td>})}</tr>)}</tbody></table></div><details style={{marginTop:20}}><summary style={{fontSize:12,cursor:'pointer'}}>Reference lists copied from Database</summary>{Object.entries(seed.lookups||{}).map(([name,rows])=><details key={name} style={{padding:10}}><summary>{name}</summary><table><tbody>{rows.map((row,i)=><tr key={i}>{row.map((v,j)=><td key={j} style={{padding:'4px 12px'}}>{v}</td>)}</tr>)}</tbody></table></details>)}</details></div>}
 </section>;
}


function TechnicalTableView({state}){
 const [projectId,setProjectId]=useState(''),[tab,setTab]=useState('table'),[config,setConfig]=useState(null),[url,setUrl]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[refresh,setRefresh]=useState(0);const generation=useRef(0);
 const viewer=state.currentUser?.appAccess?.toLowerCase()==='viewer';
 useEffect(()=>{const n=++generation.current;setConfig(null);setUrl('');setMessage('');if(!projectId)return;setBusy(true);apiRequest('getTechnicalWorkbook',{projectId},'GET',90000).then(r=>{if(n===generation.current){setConfig(r);setUrl(r.workbookId?`https://docs.google.com/spreadsheets/d/${r.workbookId}/edit`:'');}}).catch(e=>{if(n===generation.current)setMessage(e.message);}).finally(()=>{if(n===generation.current)setBusy(false);});},[projectId]);
 const connect=async(create)=>{setBusy(true);setMessage('');try{const r=await apiRequest(create?'createTechnicalWorkbook':'saveTechnicalWorkbook',{projectId,url},'POST',120000);setConfig(r);setUrl(`https://docs.google.com/spreadsheets/d/${r.workbookId}/edit`);setMessage(create?'Project workbook created. Open it in Google Sheets to paste Output and manage sharing.':'Workbook linked.');}catch(e){setMessage(e.message);}finally{setBusy(false);}};
 const gid=tab==='output'?config?.tabs?.output:config?.tabs?.['technical table'];
 const sheetUrl=tab==='database'?config?.databaseUrl:config?.workbookId?`https://docs.google.com/spreadsheets/d/${config.workbookId}/edit${gid!==undefined?'#gid='+gid:''}`:'';
 const embedUrl=sheetUrl?(tab==='database'?sheetUrl.replace(/\/edit.*$/,'/preview'): `https://docs.google.com/spreadsheets/d/${config.workbookId}/preview${gid!==undefined?'?gid='+gid:''}`):'';
 return <section style={{fontFamily:FONT_BODY}}><div role="group" aria-label="Technical Table sections" style={{display:'flex',gap:0,borderBottom:`1px solid ${T.line}`,marginBottom:18,overflowX:'auto',background:'#fff'}}>{[['table','Technical Table'],['output','Output'],['database','Database']].map(([id,label])=><button key={id} type="button" aria-pressed={tab===id} onClick={()=>setTab(id)} style={{padding:'11px 16px',border:'none',borderBottom:`3px solid ${tab===id?T.cyan:'transparent'}`,background:tab===id?T.navy:'transparent',color:tab===id?'#fff':T.inkDim,cursor:'pointer',fontFamily:FONT_BODY,fontSize:12,fontWeight:tab===id?700:500,whiteSpace:'nowrap'}}>{label}</button>)}</div>{tab!=='database'&&<><h2 style={{fontFamily:FONT_DISPLAY,fontSize:22}}>{tab==='output'?'Output':'Technical Table'}</h2><ProjectStatusSelect projects={orderedProjects(state.projects)} aria-label="Technical table project" disabled={busy} value={projectId} onChange={e=>setProjectId(e.target.value)} style={{...inputStyle,width:'100%',marginBottom:14}}><option value="">Select a project</option>{orderedProjects(state.projects).map(p=><option key={p.id} value={p.id}>{p.no} · {p.name}</option>)}</ProjectStatusSelect></>}{tab!=='database'&&projectId&&!viewer&&<div aria-label="Project workbook setup" style={{marginBottom:16,padding:14,border:`1px solid ${T.line}`,background:T.paper}}><label htmlFor="technical-workbook-url" style={{display:'block',fontSize:12,fontWeight:600}}>Google Sheets workbook link</label><p style={{fontSize:12,color:T.inkDim}}>Link the project's workbook or create a copy of the template. Each workbook keeps its Output, Technical Table, Database and CAL sheets.</p><div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:10}}><input id="technical-workbook-url" disabled={busy} aria-label="Project Google Sheets URL" placeholder="Paste project Google Sheets URL" value={url} onChange={e=>setUrl(e.target.value)} style={{...inputStyle,flex:'1 1 320px'}}/><button type="button" disabled={busy||!url} onClick={()=>connect(false)} style={smallBtn}>Link workbook</button>{!config?.workbookId&&<button type="button" disabled={busy} onClick={()=>connect(true)} style={smallBtn}>Create project workbook</button>}</div></div>}{busy&&<p role="status">Loading…</p>}{message&&<p role="status" style={{fontSize:12}}>{message}</p>}{tab==='database'?<LocalTechnicalDatabase state={state}/>:sheetUrl?<><div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:12}}><a href={sheetUrl} target="_blank" rel="noopener noreferrer" style={{...smallBtn,textDecoration:'none'}}>Open {tab==='output'?'Output':tab==='database'?'Database':'Technical Table'} in Google Sheets</a><button type="button" style={smallBtn} onClick={()=>setRefresh(x=>x+1)}>Refresh preview</button></div><p style={{fontSize:12,color:T.inkDim}}>{tab==='output'?'Paste CAD data into Output in Google Sheets. The workbook formulas generate the Technical Table.':tab==='database'?'Shared Database workbook. Select its Database tab in Google Sheets.':'This preview displays the project workbook calculated by Google Sheets.'} Google sharing permissions apply. If the preview asks you to sign in or stays blank, use Open in Google Sheets.</p><iframe key={sheetUrl+refresh} title="Google Sheets technical workbook" src={embedUrl} style={{width:'100%',height:'72vh',minHeight:450,border:`1px solid ${T.line}`,background:'#fff'}}/></>:<p style={{fontSize:13,color:T.inkDim}}>{projectId?'Link or create a project workbook to begin.':'Select a project to open its technical workbook.'}</p>}</section>;
}

function wihSystemAccount(user){return String(user?.email||'').trim().toLowerCase()==='system.enlighten@gmail.com';}
function wihProjectRole(user,id){if(wihSystemAccount(user)&&String(user?.appAccess).toLowerCase()==='admin')return 'Admin';const role=user?.projectRoles?.[String(id)]||'';return String(user?.appAccess).toLowerCase()==='viewer'?(role?'User':''):role;}
function wihCanSeeTask(user,row){const role=wihProjectRole(user,row.projectId||row.task?.projectId);return !!role&&(role==='Admin'||!!user?.userId&&String(row.assigneeUserId)===String(user.userId));}
function TimesheetView({ state, persist }) {
  const [planningTask,setPlanningTask]=useState(null);
  const [tatEditor,setTatEditor]=useState(null),[tatBusy,setTatBusy]=useState(false),[tatError,setTatError]=useState('');
  const [workTab,setWorkTab]=useState('todo'),[clock,setClock]=useState(Date.now());
  useEffect(()=>{const id=setInterval(()=>setClock(Date.now()),15000);return()=>clearInterval(id);},[]);
  const workUploadJob=useRef({});
  const [workUploadProgress,setWorkUploadProgress]=useState(null);
  const showWihFilters=wihSystemAccount(state.currentUser);
  const assignProject=id=>state.currentUser?.appAccess?.toLowerCase()!=="viewer"&&wihProjectRole(state.currentUser,id)==="Admin";
  const canAssign=(state.projects||[]).some(p=>assignProject(p.id));
  const canWork=canAssign||state.currentUser?.permissions?.wih==="own-edit";
  const [person, setPerson] = useState("All");
  const [taskSection, setTaskSection] = useState("Pending");
  const WIH_CACHE_KEY = "enlighten_wih_receipt_stages_v2400:"+String(state.currentUser?.userId||state.currentUser?.googleSubject||"anonymous");
  const WIH_CACHE_MS = 30000;
  const readWihCache = () => {
    try {
      const x = JSON.parse(localStorage.getItem(WIH_CACHE_KEY) || "null");
      return x && Array.isArray(x.rows) ? x : null;
    } catch (_) { return null; }
  };
  const [initialWihCache] = useState(readWihCache);
  const [remoteTasks, setRemoteTasks] = useState(() => initialWihCache?.rows || []);
  const [loadingRemote, setLoadingRemote] = useState(() => !initialWihCache);
  const [syncingRemote, setSyncingRemote] = useState(false);
  const [wihError,setWihError]=useState("");
  const [wihDiagnostics,setWihDiagnostics]=useState(()=>initialWihCache?.diagnostics||null);
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
      setRemoteTasks(cached.rows);setWihDiagnostics(cached.diagnostics||null);
      setLoadingRemote(false);
      return;
    }
    if (!remoteTasks.length) setLoadingRemote(true);
    setSyncingRemote(true);setWihError("");
    try{
      // Only admins may augment WIH with project-wide dashboard records.
      // WIH must show EVERY real Design Task / Design No. across every active project.
      // getWIH can contain only tasks that already have a WIH/timesheet row, so merge it
      // with each project's authoritative Design Dashboard task IDs from Google Sheets.
      const wihRows=await apiRequest('getWIH',{includeCompleted:true,includeDiagnostics:true},'GET');
      if(!Array.isArray(wihRows)&&!Array.isArray(wihRows?.rows))throw Error('The backend returned an unexpected work list. Redeploy the included Code.gs and refresh.');
      const base=Array.isArray(wihRows)?wihRows:wihRows.rows;const diagnostics=wihRows?.diagnostics||null;setWihDiagnostics(diagnostics);
      if(base.some(r=>!Object.prototype.hasOwnProperty.call(r,"receipt")))throw Error("Update and redeploy the included Apps Script backend, then refresh WIH. The running backend is missing received-drawing links.");
      const byId=new Map(base.filter(r=>r?.designTaskId&&r.receipt?.drawingId).map(r=>[String(r.designTaskId),r]));
      const nextRows=[...byId.values()];
      setRemoteTasks(nextRows);
      try { localStorage.setItem(WIH_CACHE_KEY, JSON.stringify({savedAt:Date.now(), rows:nextRows,diagnostics})); } catch (_) {}
    }
    catch(e){
      console.warn("WIH backend load failed",e);setWihError(e.message||"Could not load Work in Hand.");
      // Keep the last cached/current rows visible if Google Sheets is temporarily slow.
    }
    finally{setLoadingRemote(false);setSyncingRemote(false);}
  };
  useEffect(()=>{refresh(false);},[]);

  const currentProjectIds=new Set((state.projects||[]).map(p=>String(p.id)));
  const visibleRemoteTasks=remoteTasks.filter(r=>r.receipt?.drawingId&&currentProjectIds.has(String(r.projectId||r.task?.projectId))&&wihCanSeeTask(state.currentUser,r));
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
  })):[];
  const isDone=s=>/completed|done/i.test(String(s));
  const isProgress=s=>/in progress/i.test(String(s));
  const isPaused=s=>/paused/i.test(String(s));
  const isBlocked=s=>/blocked/i.test(String(s));
  const sectionCounts={
    Pending:displayTasks.filter(t=>!isDone(t.status)).length,
    Completed:displayTasks.filter(t=>isDone(t.status)).length,
    Unallotted:displayTasks.filter(t=>!isDone(t.status)&&!t.assignee).length,
    All:displayTasks.length
  };
  const sectionTasks=displayTasks.filter(t=>taskSection==="All"?true:taskSection==="Completed"?isDone(t.status):taskSection==="Unallotted"?!isDone(t.status)&&!t.assignee:!isDone(t.status));
  const tasks=sectionTasks.filter(t=>person==="All"||t.assignee===person).sort((a,b)=>Number(wihUrgency(b,clock).urgent)-Number(wihUrgency(a,clock).urgent)||String(a.plan?.internalDueDate||'9999').localeCompare(String(b.plan?.internalDueDate||'9999')));
  const endedSessions=displayTasks.filter(t=>(person==='All'||t.assignee===person)&&t.plan&&!isDone(t.status)&&Date.parse(t.plan.plannedEnd)<=clock);
  const people=[...new Set(teamNames)];
  useEffect(()=>{if(person!=="All"&&!people.includes(person))setPerson("All");},[person,people.join("\u0000")]);
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
    if(name&&!member)return alert("Choose an active Team Master member.");
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
    const x=completeEditor;if(!x||busyId===x.task.designTaskId)return; if(x.task.completionUploadRequired!==false&&!x.file)return alert("Please upload the completed drawing/file.");
    const hrs=Number(x.actualHours);if(!hrs||hrs<=0)return alert("Please enter actual time taken in hours.");
    setBusyId(x.task.designTaskId);
    try{let upload={};if(x.file){setWorkUploadProgress(0);const row=await uploadProjectDrawingJob(x.file,x.task.projectId||x.task.task?.projectId,'Output',workUploadJob.current,setWorkUploadProgress,x.task.designTaskId);upload={fileName:row.fileName,mimeType:row.mimeType,completionFileId:row.fileId};}await projectApi.completeTask({designTaskId:x.task.designTaskId,...upload,drawingCode:x.drawingCode,drawingFloor:x.drawingFloor,drawingArea:x.drawingArea,actualHours:hrs,notes:x.notes||""});setCompleteEditor(null );setWorkUploadProgress(null);await refresh(true);}
    catch(e){if(/expired|invalid.*session/i.test(e?.message||''))workUploadJob.current.failedExpired=true;alert(`Task completion failed: ${e?.message||e}`);}finally{setBusyId("");}
  };
  return <div>
    <div role="tablist" aria-label="Work in Hand sections" style={{display:'flex',borderBottom:`1px solid ${T.line}`,marginBottom:18,background:'#fff'}}>{[['todo','To-do'],['calendar','Calendar']].map(([id,label])=><button key={id} role="tab" aria-selected={workTab===id} type="button" onClick={()=>{setWorkTab(id);setPlanningTask(null);}} style={{padding:'11px 16px',border:0,borderBottom:`3px solid ${workTab===id?T.cyan:'transparent'}`,background:workTab===id?T.navy:'transparent',color:workTab===id?'#fff':T.inkDim,fontFamily:FONT_BODY,fontSize:12,fontWeight:workTab===id?700:500,cursor:'pointer'}}>{label}</button>)}</div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
      <div><h2 style={{fontFamily:FONT_DISPLAY,fontSize:20,margin:0,color:T.ink}}>WIH Sheet</h2><div style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim,marginTop:4}}>Work linked to received drawings appears here. Classify a received drawing to create its tasks. Enter TAT within 24 hours, then align work in the calendar. The original delivery commitment stays fixed. <span style={{fontFamily:FONT_MONO,fontSize:10,color:syncingRemote?T.orange:T.green}}>{syncingRemote?"• Updating…":wihError?"• Update failed":loadingRemote?"• Loading…":"• Synced"}</span></div></div>
    </div>
    {showWihFilters&&<div style={{background:"#fff",border:`1px solid ${T.line}`,borderRadius:8,padding:"12px 14px",marginBottom:14}}>
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
    </div>}
    {!showWihFilters&&canAssign&&<button style={{...smallBtn,marginBottom:12}} disabled={!bulkProjects.length} onClick={openBulkAssign}>Project-wise assignment</button>}
    {workTab==='calendar'&&endedSessions.length>0&&<div role="alert" style={{padding:12,border:`1px solid ${T.orange}`,fontSize:12,marginBottom:12}}>Session ended — resolve now. {endedSessions.map(t=><div key={t.designTaskId} style={{marginTop:6}}>{t.projectName} · {t.title} <button style={smallBtn} onClick={()=>setPlanningTask({...t})}>Extend / postpone</button><button style={smallBtn} disabled={busyId===t.designTaskId||isBlocked(t.status)} onClick={()=>setCompleteEditor({task:t,file:null,...workDrawingDetails(t),actualHours:t.hours||'',notes:''})}>Complete</button></div>)}<div style={{marginTop:6}}>The original TAT remains unchanged.</div></div>}
    {(workTab==='calendar'||planningTask)&&<WihPlanner onAction={action} busyId={busyId} onComplete={t=>setCompleteEditor({task:t,file:null,...workDrawingDetails(t),actualHours:t.hours||'',notes:''})} state={state} tasks={tasks} requestedTask={planningTask} onSaved={(id,plan)=>{setRemoteTasks(rows=>rows.map(r=>String(r.designTaskId)===String(id)?{...r,plan}:r));try{localStorage.removeItem(WIH_CACHE_KEY);}catch{}setPlanningTask(null);refresh(true);}}/>}
    <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:10}}><button type="button" style={smallBtn} disabled={syncingRemote} onClick={()=>refresh(true)}>Refresh work</button>{wihError&&<span role="alert" style={{fontSize:12,color:T.redline}}>{wihError}</span>}</div>
    {loadingRemote&&remoteTasks.length===0&&<div style={{fontFamily:FONT_BODY,color:T.inkDim,padding:"10px 0"}}>Loading WIH tasks for the first time…</div>}
    {!loadingRemote&&tasks.length===0&&<div style={{color:T.inkDim,fontFamily:FONT_BODY,fontSize:13,padding:"20px 0"}}>{displayTasks.length>0?'No tasks match this selection.':wihError?'The work list could not be refreshed. Please retry Refresh work.':<><strong>No received-drawing tasks are available yet.</strong><div style={{marginTop:8}}>{wihDiagnostics?.pendingClassification??(state.intakes||[]).filter(i=>!i.classified).length} drawing(s) awaiting classification. Open Classify, confirm the project, drawing type and floor / area, then refresh work.</div>{!!wihDiagnostics?.missingReceivedLink&&<div style={{marginTop:8}}>{wihDiagnostics.missingReceivedLink} existing task(s) have no valid received-drawing link. Check that their received files are linked to the same project and have not been trashed.</div>}</>}</div>}
    {workTab==='todo'&&<div style={{overflowX:'auto',background:'#fff',border:`1px solid ${T.line}`}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:760,fontFamily:FONT_BODY}}><thead><tr>{['Project','To-do','Responsible','Deadline','Align'].map(label=><th key={label} style={{background:'#D2CDC1',fontSize:12,fontWeight:600,padding:'11px 12px',textAlign:'left',borderBottom:`1px solid ${T.line}`}}>{label}</th>)}</tr></thead><tbody>{tasks.map(t=>{const editable=canWork&&(assignProject(t.projectId)||t.assigneeUserId===state.currentUser?.userId),cell={padding:'10px 12px',fontSize:12,borderBottom:`1px solid ${T.line}`,verticalAlign:'middle'};return <tr key={t.id}><td style={cell}>{t.projectName}</td><td style={cell}><strong>{t.title}</strong><div style={{fontSize:11,color:T.inkDim,marginTop:4}}>{[t.floor,t.area,t.drawingType].filter(Boolean).join(' · ')}</div><WihDashboardStatus task={t}/></td><td style={cell}>{assignProject(t.projectId)?<select aria-label={`Assign team member for ${t.designNo||t.id}`} disabled={busyId===t.designTaskId||isDone(t.status)} value={people.includes(t.assignee)?t.assignee:''} onChange={e=>assign(t,e.target.value)} style={{...inputStyle,fontSize:12,padding:'6px 8px'}}><option value="">Assign team member</option>{people.map(n=><option key={n}>{n}</option>)}</select>:t.assignee||'Unassigned'}</td><td style={cell}>{t.plan?.internalDueDate?<><div>{formatProjectDate(t.plan.internalDueDate)}</div>{wihUrgency(t,clock).urgent&&<div style={{fontSize:11,color:T.redline,fontWeight:600,marginTop:3}}>URGENT</div>}</>:editable&&!isDone(t.status)?<button style={smallBtn} onClick={()=>{setTatError('');setTatEditor({task:t,days:3});}}>Enter TAT</button>:<span style={{color:T.inkDim}}>TAT not entered</span>}</td><td style={cell}>{editable&&!isDone(t.status)&&<button type="button" style={smallBtn} disabled={!t.plan?.internalDueDate} title={!t.plan?'Enter TAT first':'Add this work to your calendar'} onClick={()=>{setWorkTab('calendar');setPlanningTask({...t});}}>Align</button>}</td></tr>;})}</tbody></table></div>}
    {tatEditor&&<div style={{position:'fixed',inset:0,zIndex:14000,background:'rgba(8,25,45,.45)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}><div role="dialog" aria-modal="true" aria-label="Enter TAT" style={{width:'min(420px,95vw)',background:T.paper,padding:22,border:`1px solid ${T.line}`,fontFamily:FONT_BODY}}><h3 style={{fontFamily:FONT_DISPLAY,marginTop:0}}>Enter TAT</h3><p style={{fontSize:12}}>{tatEditor.task.projectName} · {tatEditor.task.title}</p><label style={{fontSize:12}}>Completion time (calendar days from receipt)<input aria-label="TAT days" type="number" min="1" max="365" value={tatEditor.days} disabled={tatBusy} style={inputStyle} onChange={e=>setTatEditor(x=>({...x,days:e.target.value}))}/></label><p style={{fontSize:12}}>TAT and the calculated deadline are locked after saving. Use Align afterwards to add a calendar slot.</p>{tatError&&<p role="alert" style={{fontSize:12,color:T.redline}}>{tatError}</p>}<div style={{display:'flex',gap:8,justifyContent:'flex-end'}}><button style={smallBtn} disabled={tatBusy} onClick={()=>setTatEditor(null)}>Cancel</button><button style={smallBtn} disabled={tatBusy} onClick={async()=>{if(tatBusy)return;setTatBusy(true);setTatError('');try{const plan=await apiRequest('saveWihPlan',{designTaskId:tatEditor.task.designTaskId,tatDays:Number(tatEditor.days),tatOnly:true},'POST',120000);setRemoteTasks(rows=>rows.map(r=>String(r.designTaskId)===String(tatEditor.task.designTaskId)?{...r,plan}:r));try{localStorage.removeItem(WIH_CACHE_KEY);}catch{}setTatEditor(null);}catch(e){setTatError(e.message);}finally{setTatBusy(false);}}}>{tatBusy?'Saving…':'Save TAT'}</button></div></div></div>}
    {bulkAssignOpen&&<div style={{position:"fixed",inset:0,zIndex:13900,background:"rgba(8,25,45,.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{width:"min(760px,96vw)",maxHeight:"88vh",overflow:"auto",background:T.paper,border:`1px solid ${T.line}`}}><div style={{background:T.navy,color:"#fff",padding:15,fontFamily:FONT_DISPLAY,fontSize:19}}>Project-wise Task Assignment</div><div style={{padding:16}}><div style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim,marginBottom:14}}>Select one project, then assign each task type once. The selected team member will be applied to every open task of that type in this project.</div><Field label="PROJECT"><ProjectStatusSelect projects={bulkProjects} value={bulkProjectId} onChange={e=>{setBulkProjectId(e.target.value);setBulkAssignments({});}} style={inputStyle}>{bulkProjects.map(p=><option key={p.id} value={p.id}>{p.no||p.projectNo||"—"} — {p.name}</option>)}</ProjectStatusSelect></Field>{bulkTaskGroups.length===0?<div style={{fontFamily:FONT_BODY,color:T.inkDim,padding:"14px 0"}}>No open WIH tasks for this project.</div>:<div style={{border:`1px solid ${T.line}`}}>{bulkTaskGroups.map(g=><div key={g.title} style={{display:"grid",gridTemplateColumns:"1.4fr 90px 1fr",gap:10,alignItems:"center",padding:"11px 12px",borderBottom:`1px solid ${T.line}`,background:"#fff"}}><div><div style={{fontFamily:FONT_BODY,fontWeight:700,fontSize:13}}>{g.title}</div><div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim}}>{g.tasks.length} open task{g.tasks.length===1?"":"s"}</div></div><div style={{fontFamily:FONT_MONO,fontSize:11,color:T.inkDim}}>{[...new Set(g.tasks.map(t=>t.floor).filter(Boolean))].join(", ")||"—"}</div><select value={bulkAssignments[g.title]||""} onChange={e=>setBulkAssignments(x=>({...x,[g.title]:e.target.value}))} style={{...inputStyle,padding:"7px 8px",fontSize:12}}><option value="">Keep current / unassigned</option>{people.map(n=><option key={n}>{n}</option>)}</select></div>)}</div>}<div style={{marginTop:12,fontFamily:FONT_MONO,fontSize:11,color:T.inkDim}}>{bulkProjectTasks.length} total open task{bulkProjectTasks.length===1?"":"s"} in selected project.</div></div><div style={{padding:14,borderTop:`1px solid ${T.line}`,display:"flex",justifyContent:"flex-end",gap:8}}><button disabled={bulkSaving} onClick={()=>setBulkAssignOpen(false)} style={{...smallBtn,background:"#fff"}}>Cancel</button><button disabled={bulkSaving||!bulkTaskGroups.length} onClick={saveBulkAssignments} style={{...smallBtn,background:T.navy,color:"#fff",padding:"9px 14px"}}>{bulkSaving?"SAVING…":"SAVE PROJECT ASSIGNMENTS"}</button></div></div></div>}
    {completeEditor&&<div style={{position:"fixed",inset:0,zIndex:14000,background:"rgba(8,25,45,.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{width:"min(650px,96vw)",background:T.paper,border:`1px solid ${T.line}`}}><div style={{background:T.navy,color:"#fff",padding:14,fontFamily:FONT_DISPLAY,fontSize:18}}>Complete WIH Task · {completeEditor.task.designNo||completeEditor.task.title}</div><div style={{padding:16}}><p style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim}}>The completed drawing is saved in this project’s Output folder. Issue it from Drive to move it to Sent.</p>{workUploadProgress!==null&&<p role="status" style={{fontSize:12}}>Uploading to Output · {workUploadProgress}%</p>}<Field label={completeEditor.task.completionUploadRequired===false?"Output / meeting record (optional)":"Completed drawing / output file *"}><input type="file" style={{...inputStyle,padding:8}} onChange={e=>setCompleteEditor(x=>({...x,file:e.target.files?.[0]||null,...workDrawingDetails(x.task,e.target.files?.[0]?.name)}))}/></Field>{completeEditor.file&&<div style={{borderTop:`1px solid ${T.line}`,paddingTop:12,marginTop:12}}><p style={{fontFamily:FONT_BODY,fontSize:11,color:T.inkDim}}>Picked from the task and file. Confirm once here; these details carry through to issue.</p>{[['Drawing code','drawingCode'],['Floor(s)','drawingFloor'],['Zone / Area','drawingArea']].map(([label,key])=><Field key={key} label={label}><input aria-label={`Work drawing ${key}`} disabled={busyId===completeEditor.task.designTaskId} value={completeEditor[key]||''} onChange={e=>setCompleteEditor(x=>({...x,[key]:e.target.value}))} style={inputStyle}/></Field>)}</div>}<Field label="Actual time taken (hours) *"><input type="number" min="0.01" step="0.25" value={completeEditor.actualHours} onChange={e=>setCompleteEditor(x=>({...x,actualHours:e.target.value}))} style={inputStyle}/></Field><Field label={completeEditor.task.taskCategory==='Meeting'?"Meeting minutes / outcome *":"Completion remarks"}><textarea value={completeEditor.notes} onChange={e=>setCompleteEditor(x=>({...x,notes:e.target.value}))} style={{...inputStyle,minHeight:70}}/></Field></div><div style={{padding:14,borderTop:`1px solid ${T.line}`,display:"flex",justifyContent:"flex-end",gap:8}}><button disabled={busyId===completeEditor.task.designTaskId} onClick={()=>{setCompleteEditor(null);setWorkUploadProgress(null);}} style={{...smallBtn,background:"#fff"}}>Cancel</button><button disabled={busyId===completeEditor.task.designTaskId} onClick={finish} style={{...smallBtn,background:T.navy,color:"#fff"}}>Upload & Complete Task</button></div></div></div>}
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
  const allProjects=orderedProjects(state.projects);
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
    <label style={{display:"grid",gap:6,fontFamily:FONT_BODY,fontSize:12,maxWidth:560,marginBottom:16}}>Find and open a project<ProjectStatusSelect projects={projects} aria-label="Floor / Zone project" value={project?.id||""} disabled={areaSaving||bulkSaving} onChange={e=>{setProjectId(e.target.value);setEditor(null);setBulkEditor(null);}} style={inputStyle}><option value="">Select {projectGroup==="completed"?"a completed":"an ongoing"} project…</option>{projects.map(p=><option key={p.id} value={p.id}>{p.no||p.projectNo||""} · {p.name||p.id}</option>)}</ProjectStatusSelect></label>
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

function ProjectOnboarding({ state, persist, selectedId, setSelectedId, initialMode = "browse", projectEditor=null }) {
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
            {orderedProjects(state.projects).map((p) => {
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

      {mode === "browse" && projectEditor}
      {mode === "browse" && !projectEditor && selected && (() => {
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
  if(matching.every(w=>/completed|^done$/i.test(String(w.task?.actualStatus||w.actualStatus||w.status))))return 'Completed';
  if(matching.some(w=>/review|approval/i.test(String(w.task?.actualStatus||w.actualStatus||w.status))))return 'Up for review';
  if(matching.some(w=>/started|in.progress|paused|completed|^done$/i.test(String(w.task?.actualStatus||w.actualStatus||w.status))))return 'In progress';
  if(matching.some(w=>w.status==='Ready'))return 'Ready';
  if(!sub&&stages.length&&matching.every(w=>!w.task?.parentDesignTaskId))return 'Activated';
  return matching[0].status||'Waiting';
}
function workflowPrerequisite(row,drawings,zones,area,instances){
  const type=drawingTypeKey(row.triggerDrawingType||'MANUAL');
  if(type==='MANUAL'){
    const confirmed=instances.some(w=>{const t=w.task||{};return !t.parentDesignTaskId&&String(t.workflowVersion)==='2'&&((row.lineWorkId&&t.lineWorkId===row.lineWorkId)||(t.taskType===row.triggerTaskType&&drawingTypeKey(t.dependencyDrawingType)==='MANUAL'));});
    return {text:confirmed?'Milestone confirmed':'Milestone not confirmed',title:row.startingMilestone||'Starting milestone / approvals',ready:confirmed};
  }
  if(drawings===null)return {text:'Checking drawings…',title:'Loading received drawing records'};
  if(drawings===undefined)return {text:'Unable to check drawings',title:'Could not load received drawings. Reload Line of Work to retry.'};
  const matching=drawings.filter(d=>drawingTypeKey(d.drawingType)===type);
  const parse=value=>{if(Array.isArray(value))return value;try{const v=JSON.parse(value||'[]');return Array.isArray(v)?v:[];}catch{return [];}};
  const covers=(d,z)=>{
    const coverage=parse(d.coverage);if(coverage.length)return coverage.some(c=>String(c.floor).trim().toLowerCase()===String(z.floor).trim().toLowerCase()&&(!c.area||String(c.area).trim().toLowerCase()===String(z.area).trim().toLowerCase()));
    const floors=parse(d.floors);if(!floors.length)floors.push(...String(d.floor||'').split(',').map(f=>f.trim()).filter(Boolean));
    return floors.some(f=>String(f).trim().toLowerCase()===String(z.floor).trim().toLowerCase())&&(!d.area||String(d.area).trim().toLowerCase()===String(z.area).trim().toLowerCase());
  };
  const targets=area?[area]:zones.filter(z=>z.floor&&z.area);
  const count=targets.filter(z=>matching.some(d=>covers(d,z))).length;
  const received=targets.length?count>0:matching.length>0;
  const partial=received&&targets.length>0&&count<targets.length;
  return {text:partial?'Drawing partially received':received?'Drawing received':'Drawing not received',title:`${type}${targets.length?` · ${count} of ${targets.length} areas covered`:''} · Receipt does not confirm classification or milestone approval.`,ready:received&&!partial};
}

function workflowWorkStatus(value){
  const s=String(value||'').trim().toLowerCase();
  if(/completed|^done$/.test(s))return {label:'Completed',bg:'#E8F2E9',fg:'#245C2B'};
  if(/review|approval/.test(s))return {label:'Approval required',bg:'#E6EEF4',fg:'#1D4E89'};
  if(/in.progress|^started$|paused/.test(s))return {label:'In progress',bg:'#FFF4D6',fg:'#7A5A00'};
  if(/^ready$|^aligned$|^assigned$|^open$/.test(s))return {label:'Aligned',bg:'#F3F1EA',fg:'#625B48'};
  return {label:'Not started',bg:'#F4E5E0',fg:'#853D32'};
}

function workflowDotStatus(value,prerequisite){
  const raw=String(value||'').trim().toLowerCase();
  if(/completed|^done$/.test(raw))return {status:'Completed',label:'Completed'};
  if(/review|approval/.test(raw))return {status:'Up for review',label:'Up for review'};
  if(/in.progress|^started$|paused/.test(raw))return {status:'In-progress',label:'In progress'};
  if(/^aligned$/.test(raw))return {status:'Aligned',label:'Aligned'};
  if(/^ready$|^assigned$|^open$/.test(raw))return {status:'Open',label:'Ready to start'};
  if(prerequisite?.text==='Drawing not received')return {status:'Pending',label:'Drawing pending · Not started'};
  if(prerequisite?.text==='Drawing partially received')return {status:'Pending',label:'Drawing partially received · Not started'};
  if(raw.includes('awaiting parent'))return {status:'Pending',label:'Not started · Waiting for parent task'};
  return {status:'Pending',label:'Not started'};
}
function workflowStageDot(statuses){
  if(statuses.length&&statuses.every(s=>s.status==='Completed'))return {status:'Completed',label:'Completed'};
  for(const key of ['Up for review','In-progress','Completed','Open','Aligned'])if(statuses.some(s=>s.status===key))return key==='Completed'?{status:'In-progress',label:'In progress'}:statuses.find(s=>s.status===key);
  return statuses.find(s=>s.label.startsWith('Drawing'))||statuses[0]||{status:'Pending',label:'Not started'};
}
function workflowSunsetColor(position){
  const shades=['#E8C991','#FFCB84','#FFA46C','#F27C60','#D75059','#91445B','#21364E'];
  const point=Math.max(0,Math.min(1,position))*(shades.length-1),index=Math.min(shades.length-2,Math.floor(point)),mix=point-index;
  const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)),a=rgb(shades[index]),b=rgb(shades[index+1]);
  return '#'+a.map((v,i)=>Math.round(v+(b[i]-v)*mix).toString(16).padStart(2,'0')).join('');
}
function workflowSunsetSegment(index,count){
  const start=index/Math.max(1,count),end=(index+1)/Math.max(1,count);
  return `linear-gradient(180deg,${[0,.25,.5,.75,1].map(t=>`${workflowSunsetColor(start+(end-start)*t)} ${t*100}%`).join(',')})`;
}
function workflowDotColor(status){
  return ({Pending:'#FF3B30',Open:'#34C759',Aligned:'#A79B85','In-progress':'#FFCC00','Up for review':'#3399FF',Completed:'#AF52DE'})[status]||'#A79B85';
}
function WorkflowStatusLegend(){
  return <footer aria-label="Workflow status dot legend" style={{display:'flex',gap:16,flexWrap:'wrap',alignItems:'center',borderTop:`1px solid ${T.line}`,paddingTop:12,marginTop:18,fontFamily:FONT_BODY,fontSize:11,color:T.inkDim}}>{[['Pending','Pending / Not started'],['Open','Ready to start'],['Aligned','Aligned'],['In-progress','In progress'],['Up for review','Up for review'],['Completed','Completed']].map(([status,label])=><span key={status} style={{display:'inline-flex',gap:6,alignItems:'center'}}><WorkflowStatusDot status={status} label={label}/>{label}</span>)}</footer>;
}
function WorkflowStatusDot({status,label}){
  return <span role="img" aria-label={label} title={label} data-workflow-status={status} style={{display:'inline-block',width:10,height:10,minWidth:10,borderRadius:'50%',background:workflowDotColor(status),verticalAlign:'middle',flexShrink:0}}/>;
}

function visitCoverageList(raw,fallback){let list=raw;if(typeof raw==='string'){try{list=JSON.parse(raw);}catch{list=null;}}if(!Array.isArray(list))list=String(fallback||'').split(/\s+\+\s+|,/);return [...new Set(list.map(String).map(v=>v.trim()).filter(Boolean))];}
function visitWorkItems(row){return visitCoverageList(row.workItems,row.milestone);}
function visitFloors(row){return visitCoverageList(row.floors,row.floor||'Project');}
function activeVisits(rows){return (rows||[]).filter(r=>r.active!==false&&String(r.active).toLowerCase()!=='false');}

function visitHistory(row){try{const list=JSON.parse(row.history||'[]');return Array.isArray(list)?list:[];}catch{return [];}}
function executionVisitDefaults(project){
  const known=[...new Set((project.floorZones||Object.values(project.zones||{})).map(z=>z.floor).filter(Boolean))].filter(f=>!/facade/i.test(f));
  const floors=known.length?known:['1F','2F','3F','4F','Terrace','Stilt'];
  const rows=[];const add=(stage,milestone,floor,visitType,essential=false,weekly=false)=>rows.push({visitPlanId:`EV-${project.id}-${rows.length+1}`,projectId:project.id,seq:rows.length+1,stage,milestone,floor,visitType,essential,weekly,plannedVisits:1,closed:false,history:'[]'});
  [['False Ceiling','False Ceiling',true],['Electrical','Wiring',true],['Bathroom Stone','Bathroom Stone',false],['Ceiling Pack','Ceiling Pack | Moulding Sampling & Review',true],['Furniture','Furniture',false]].forEach(([stage,milestone,essential])=>{floors.forEach((f,i)=>add(stage,milestone,f,stage==='Furniture'||i<(stage==='Ceiling Pack'?1:2)?'Briefing & Review':'Review',essential));if(stage==='Bathroom Stone')add('Facade','Facade Elevation','Facade','Briefing & Review');});
  for(let i=0;i<floors.length;i+=2)add('Transition to Execution','Finalise Architectural Lighting',floors.slice(i,i+2).join(' + '),'Visit',true);
  ['Marking | Cutting','Light Installation','Snag List'].forEach(milestone=>floors.forEach(f=>add('Execution Phase',milestone,f,'Weekly visit',false,true)));
  add('Staging','Staging and Scene Setting','Project','Visit');add('Staging','Staging and Scene Setting','Project','Visit');
  return rows;
}
function orderWorkflowGroups(groups,mode,drawings,instances){
  if(mode==='manual')return groups;
  const receiptDate=g=>(drawings||[]).filter(d=>drawingTypeKey(d.drawingType)===drawingTypeKey(g.first.triggerDrawingType)).map(d=>String(d.receivedSentDate||d.createdAt||'')).filter(Boolean).sort()[0]||'';
  const rank=g=>{const statuses=g.rows.map(r=>workflowWorkStatus(workflowActivationStatus(instances,g.first,r)).label);if(statuses.every(s=>s==='Completed'))return 0;if(statuses.some(s=>['In progress','Approval required'].includes(s)))return 1;return receiptDate(g)?2:3;};
  return groups.map((g,i)=>({g,i})).sort((a,b)=>rank(a.g)-rank(b.g)||(receiptDate(a.g)&&receiptDate(b.g)?receiptDate(a.g).localeCompare(receiptDate(b.g)):0)||a.i-b.i).map(x=>x.g);
}
function workflowStageBand(g){const name=String(g.first.tasks||'');return /concept/i.test(name)?0:/control.*finali[sz]|finali[sz].*control/i.test(name)?1:/wall electrical|wall elec/i.test(name)?2:/documentation/i.test(name)?4:3;}
function pinWorkflowGroups(groups,mode='drawing'){const band=g=>{const value=workflowStageBand(g);return mode==='manual'&&value!==0&&value!==4?3:value;};return groups.map((g,i)=>({g,i})).sort((a,b)=>band(a.g)-band(b.g)||a.i-b.i).map(x=>x.g);}
function designMeetingVisitRows(project,groups,visits){const known=new Set(visits.map(v=>String(v.visitPlanId))),extra=[];for(const g of groups)for(const row of g.rows){if(row.taskCategory!=='Meeting')continue;const key=String(row.id||row.lineWorkId||[g.first.tasks,row.subtask].join('-')),id='DM-'+project.id+'-'+key;if(known.has(id))continue;extra.push({visitPlanId:id,projectId:project.id,seq:900+extra.length,stage:'Design meeting: '+g.first.tasks,milestone:g.first.tasks,workItems:[g.first.tasks],floor:'Project',floors:['Project'],title:row.subtask,visitType:'Design meeting',plannedVisits:1,weekly:false,essential:false,closed:false,history:'[]',_designMeeting:true});}return [...visits,...extra];}
function meetingForDesignSubtask(project,group,sub,visits){const id='DM-'+project.id+'-'+String(sub.id||sub.lineWorkId||[group.first.tasks,sub.subtask].join('-'));return visits.find(v=>String(v.visitPlanId)===id)||visits.find(v=>v.stage==='Design meeting: '+group.first.tasks&&v.title===sub.subtask);}
function alignWorkflowVisits(groups,visits){
  const used=new Set(),lastDoc=groups.map((g,i)=>/documentation/i.test(g.first.tasks||'')?i:-1).filter(i=>i>=0).at(-1);
  const pairs=groups.map((group,index)=>{const text=[group.first.tasks,group.first.triggerTaskType].join(' ').toLowerCase();
    const match=row=>{const m=visitWorkItems(row).join(' / ').toLowerCase();
      if(String(row.stage||'').startsWith('Design meeting: '))return row.stage==='Design meeting: '+group.first.tasks;
      if(/false ceiling|fc corrections/.test(text))return /false ceiling|ceiling pack|moulding/.test(m);
      if(/wiring|lighting layout/.test(text))return /\bwiring\b/.test(m);
      if(/bathroom|bath elevation/.test(text))return /bathroom stone/.test(m);
      if(/furniture|joinery/.test(text))return /\bfurniture\b/.test(m);
      if(/facade/.test(text))return /facade/.test(m);
      if(/finali[sz]e architectural/.test(text)||index===lastDoc)return /finali[sz]e architectural|marking.*cutting/.test(m);
      return false;};
    const matched=visits.filter(row=>!used.has(row.visitPlanId)&&match(row));matched.forEach(row=>used.add(row.visitPlanId));return {group,visits:matched};});
  return {pairs,remaining:visits.filter(row=>!used.has(row.visitPlanId))};
}
function momActionLines(notes){let selected=[],all=[],inActions=false,hasSections=false,follow=false;String(notes||'').split(/\r?\n/).forEach(raw=>{let line=raw.trim().replace(/^#+\s*/, '').replace(/^[-*•]\s*|^\d+[.)]\s*/,'').replace(/\*\*/g,'');if(!line)return;const heading=/^(visit summary|discussion|decisions|action items?|next steps?|follow[ -]?ups?|to[ -]?do|open points)(?:\s*\([^)]*\))?\s*:?$/i.exec(line);if(heading){inActions=/action|next|follow|to[ -]?do/i.test(heading[1]);follow=/follow/i.test(heading[1]);hasSections=true;return;}if(/^(project|milestone|floor|date|visit date|visited by|attendees)\s*:/i.test(line))return;if(/^(none|not provided|no action items|n\/a)\.?$/i.test(line))return;if(/^(action|task|item)\s*\|\s*(owner|responsible)/i.test(line)||/^[|:\s-]+$/.test(line))return;if(inActions)selected.push(follow?'Follow-up: '+line:line);all.push(line);});return hasSections?selected:all;}
function MomDraftAssistant({projectId,row,date,visitBy,onUse,onBusy,disabled}){
  const [notes,setNotes]=useState(''),[draft,setDraft]=useState(''),[error,setError]=useState(''),[pending,setPending]=useState(''),[recording,setRecording]=useState(false),[seconds,setSeconds]=useState(0),[clip,setClip]=useState(null);
  const capture=useRef(null),alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;const c=capture.current;if(c){clearInterval(c.timer);try{if(c.recorder.state!=='inactive')c.recorder.stop();}catch{}c.stream.getTracks().forEach(t=>t.stop());}};},[]);
  useEffect(()=>{onBusy?.(!!pending||recording);return()=>onBusy?.(false);},[pending,recording,onBusy]);
  const toBase64=blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('Could not read the audio clip.'));reader.readAsDataURL(blob);});
  const transcribe=async blob=>{if(!blob?.size)return;if(blob.size>2*1024*1024){setError('Use an audio clip smaller than 2 MB. Record a shorter segment.');return;}setPending('Transcribing…');setError('');try{const result=await projectApi.transcribeVisitMom({projectId,visitPlanId:row.visitPlanId,mimeType:blob.type,audio:await toBase64(blob)});if(alive.current)setNotes(value=>[value,result.text].filter(Boolean).join('\n'));}catch(e){if(alive.current)setError(e.message);}finally{if(alive.current)setPending('');}};
  const stop=()=>{const c=capture.current;if(c&&c.recorder.state!=='inactive')c.recorder.stop();};
  const start=async()=>{
    if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){setError('Microphone recording is unavailable here. Use your keyboard microphone, type notes, or upload a short audio clip.');return;}
    setError('');setPending('Opening microphone…');let stream;
    try{stream=await navigator.mediaDevices.getUserMedia({audio:true});if(!alive.current){stream.getTracks().forEach(t=>t.stop());return;}
      const mime=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(type=>MediaRecorder.isTypeSupported(type));
      if(!mime)throw Error('This browser cannot record a supported audio format. Upload MP3, M4A, MP4, WAV or WebM instead.');
      const recorder=new MediaRecorder(stream,{mimeType:mime,audioBitsPerSecond:64000}),chunks=[];let size=0,elapsed=0;
      const c={recorder,stream,timer:null};capture.current=c;
      recorder.ondataavailable=e=>{if(e.data.size){chunks.push(e.data);size+=e.data.size;if(size>=1900000)stop();}};
      recorder.onerror=()=>{if(alive.current)setError('The microphone stopped unexpectedly. You can retry or type your notes.');stop();};
      recorder.onstop=()=>{clearInterval(c.timer);stream.getTracks().forEach(t=>t.stop());if(capture.current===c)capture.current=null;if(!alive.current)return;setRecording(false);const blob=new Blob(chunks,{type:mime});setClip(blob);transcribe(blob);};
      recorder.start(1000);setSeconds(0);setRecording(true);setPending('');c.timer=setInterval(()=>{elapsed++;if(alive.current)setSeconds(elapsed);if(elapsed>=120)stop();},1000);
    }catch(e){stream?.getTracks().forEach(t=>t.stop());if(alive.current){setPending('');setError(e.name==='NotAllowedError'?'Microphone permission was denied. Enable it or type/upload your notes.':e.message);}}
  };
  const generate=async()=>{setPending('Preparing MOM draft…');setError('');try{const result=await projectApi.draftVisitMom({projectId,visitPlanId:row.visitPlanId,notes,date,visitBy});if(alive.current)setDraft(result.text);}catch(e){if(alive.current)setError(e.message);}finally{if(alive.current)setPending('');}};
  const working=disabled||!!pending||recording;
  return <section aria-label="AI MOM assistant" style={{border:`1px solid ${T.line}`,padding:12,margin:'16px 0',background:'#F3F1EA',fontFamily:FONT_BODY}}><h4 style={{margin:'0 0 8px',fontFamily:FONT_DISPLAY}}>Dictate & Draft MOM</h4><p style={{fontSize:12,color:T.inkDim,lineHeight:1.5}}>Record short Hindi or English notes, or type them below. Audio/notes are sent to OpenAI for transcription and drafting. Review the result before using it.</p><div style={{display:'flex',gap:7,flexWrap:'wrap',alignItems:'center',marginBottom:10}}>{recording?<button type="button" style={{...smallBtn,color:T.redline}} onClick={stop}>Stop & transcribe ({seconds}s)</button>:<button type="button" style={smallBtn} disabled={working} onClick={start}>Record dictation</button>}<label style={{...smallBtn,opacity:working?0.5:1,cursor:working?'default':'pointer'}}>Upload audio<input aria-label="Upload MOM audio" type="file" accept="audio/*" disabled={working} style={{display:'none'}} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file){setClip(file);transcribe(file);}}}/></label>{clip&&!recording&&<button type="button" disabled={working} style={smallBtn} onClick={()=>transcribe(clip)}>Retry transcription</button>}</div><textarea aria-label="Dictated visit notes" value={notes} maxLength={12000} disabled={working} onChange={e=>setNotes(e.target.value)} placeholder="Raw visit notes / dictation transcript" style={{...inputStyle,fontSize:13,minHeight:100,resize:'vertical'}}/><p style={{fontSize:11,color:T.inkDim}}>Up to 2 minutes per recording / 2 MB per clip. You can add more segments.</p><button type="button" disabled={working||!notes.trim()} style={smallBtn} onClick={generate}>Generate MOM draft</button>{pending&&<p role="status" style={{fontSize:12}}>{pending}</p>}{error&&<p role="alert" style={{fontSize:12,color:T.redline}}>{error}</p>}{draft&&<div style={{marginTop:14}}><label style={{fontSize:12,fontWeight:600}}>Review AI draft<textarea aria-label="AI MOM draft" value={draft} disabled={working} onChange={e=>setDraft(e.target.value)} style={{...inputStyle,fontSize:13,minHeight:180,marginTop:6,resize:'vertical'}}/></label><button type="button" disabled={working||!draft.trim()} style={{...smallBtn,marginTop:8}} onClick={()=>onUse(draft)}>Use this draft</button></div>}</section>;
}

function ExecutionVisitPlanner({project,rows,onChange,loadError,loading,children,state,persist}){
  const [assisting,setAssisting]=useState(false);
  const [draft,setDraft]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const savePlan=async(list,initializeOnly=false)=>{const previous=rows,previousDraft=draft;list=list.map(r=>({...r,workItems:visitWorkItems(r),floors:visitFloors(r),milestone:visitWorkItems(r).join(' + '),floor:visitFloors(r).join(' + ')}));if(rows.some(r=>r._draft)){const all=new Map(rows.map(r=>[r.visitPlanId,r]));list.forEach(r=>all.set(r.visitPlanId,r));list=[...all.values()];}list=list.map(r=>({...r,workItems:visitWorkItems(r),floors:visitFloors(r),milestone:visitWorkItems(r).join(' + '),floor:visitFloors(r).join(' + ')}));setBusy(true);setError('');setNotice('Changes applied · Saving…');const merged=new Map(rows.map(r=>[r.visitPlanId,r]));list.forEach(r=>merged.set(r.visitPlanId,{...merged.get(r.visitPlanId),...r}));onChange([...merged.values()].sort((a,b)=>Number(a.seq)-Number(b.seq)));setDraft(null);try{onChange(activeVisits(await projectApi.saveExecutionVisits(project.id,list,initializeOnly)));setNotice('Saved to Google Sheets.');}catch(e){onChange(previous);setDraft(previousDraft);setNotice('');setError(`Could not save: ${e.message} Previous values restored. Retry your changes.`);}finally{setBusy(false);}};
  const record=async()=>{const previous=rows,entry=draft;setBusy(true);setError('');setNotice('Visit added · Saving…');onChange(rows.map(r=>r.visitPlanId===entry.row.visitPlanId?{...r,...(r.scheduledDate===entry.row.scheduledDate?{scheduledDate:''}:{}),history:JSON.stringify([...visitHistory(r),{visitId:entry.visitId,date:entry.date,visitBy:entry.visitBy,notes:entry.notes}])}:r));setDraft(null);try{const saved=await projectApi.recordExecutionVisit({projectId:project.id,visitPlanId:entry.row.visitPlanId,visitId:entry.visitId,date:entry.date,visitBy:entry.visitBy,notes:entry.notes,actionItems:(entry.taskText??momActionLines(entry.notes).join('\n')).split(/\r?\n/).map(line=>line.trim()).filter(Boolean),scheduledFor:entry.row.scheduledDate||''});onChange(activeVisits(saved));if(typeof CustomEvent!=='undefined')window.dispatchEvent?.(new CustomEvent('enlighten-mom-tasks-changed',{detail:{projectId:project.id}}));setNotice('Visit saved to Google Sheets.');}catch(e){onChange(previous);setDraft(entry);setNotice('');setError(`Visit could not be saved: ${e.message} Retry to save it.`);}finally{setBusy(false);}};
  const editReview=row=>setDraft({kind:'plan',row:{...row,workItems:visitWorkItems(row),floors:visitFloors(row)}});
  const newReview=work=>editReview({visitPlanId:uid(),seq:Math.max(0,...rows.map(r=>Number(r.seq)||0))+1,stage:'Site review',milestone:work||'False Ceiling',floor:(project.floorZones||[])[0]?.floor||'Project',title:'',visitType:'Review',plannedVisits:1,weekly:false,essential:false,closed:false});
  const workOptions=[...new Set(['False Ceiling','Wiring','Bathroom Stone','Facade Elevation','Ceiling Pack | Moulding Sampling & Review','Furniture','Finalise Architectural Lighting','Marking | Cutting','Light Installation','Snag List','Staging and Scene Setting',...rows.flatMap(visitWorkItems),...(draft?.row?.workItems||[])])];
  const floorOptions=[...new Set([...(project.floorZones||Object.values(project.zones||{})).map(z=>z.floor).filter(Boolean),...rows.flatMap(visitFloors),...(draft?.row?.floors||[]),'Facade','Project'])];
  const toggleCoverage=(field,value,checked)=>setDraft(d=>({...d,row:{...d.row,[field]:checked?[...new Set([...(d.row[field]||[]),value])]:(d.row[field]||[]).filter(v=>v!==value)}}));
  const removeReview=async row=>{const previous=rows,entry=draft;setDraft(null);onChange(rows.filter(r=>r.visitPlanId!==row.visitPlanId));if(row._draft||!rows.some(r=>r.visitPlanId===row.visitPlanId)){setNotice('Review removed from draft.');return;}setBusy(true);setError('');setNotice('Removing review…');try{onChange(activeVisits(await projectApi.deleteExecutionVisit({projectId:project.id,visitPlanId:row.visitPlanId})));setNotice('Review removed.');}catch(e){onChange(previous);setDraft(entry);setNotice('');setError(e.message);}finally{setBusy(false);}};
  const openVisitAction=async(row,kind)=>{if(busy)return;setError('');if(kind==='schedule'){setDraft({kind,row,date:row.scheduledDate||todayISO()});return;}if(row._designMeeting){setBusy(true);try{const saved=activeVisits(await projectApi.saveExecutionVisits(project.id,[row],true));onChange(saved);row=saved.find(v=>String(v.visitPlanId)===String(row.visitPlanId));if(!row)throw Error('Meeting could not be prepared.');}catch(e){setError(e.message);return;}finally{setBusy(false);}}setDraft(kind==='schedule'?{kind,row,date:row.scheduledDate||todayISO()}:{kind:'record',row,visitId:uid(),date:todayISO(),visitBy:'',notes:''});};
  const renderDesignMeetingControls=(row,mode,disabled=false)=>row?<span className="design-meeting-inline" aria-label={`Meeting actions for ${row.title||row.milestone}`} style={{display:'inline-flex',alignItems:'center',gap:6,flexWrap:'wrap',background:'transparent',padding:0,marginLeft:8,borderRadius:3,verticalAlign:'middle'}}><button type="button" disabled={busy||disabled||row._draft} onClick={()=>openVisitAction(row,'schedule')} style={{...smallBtn,padding:'3px 5px',fontSize:9}}>{row.scheduledDate?'Reschedule':'Schedule'}</button><button type="button" disabled={busy||disabled||row._draft} onClick={()=>openVisitAction(row,'record')} style={{...smallBtn,padding:'3px 5px',fontSize:9}}>Log MOM</button>{row.scheduledDate&&<span style={{fontSize:10}}>{formatProjectDate(row.scheduledDate)}</span>}</span>:null;
  const renderVisitTable=(list,compact=false)=>list.length?(<div style={{overflowX:'auto'}}><table aria-label="Execution visit plan" style={{width:'100%',minWidth:340,borderCollapse:'collapse',tableLayout:'fixed'}}><colgroup>{!compact&&<col style={{width:'45%'}}/>}<col style={{width:compact?'27.27%':'15%'}}/><col style={{width:compact?'72.73%':'40%'}}/></colgroup>{!compact&&<thead><tr>{['Meeting / Visit','Floors','Date / Actions'].map(h=><th key={h} style={{...thStyle,background:'#D2CDC1',color:T.ink,textAlign:h==='Meeting / Visit'?'left':'center',whiteSpace:'normal',fontSize:9}}>{h}</th>)}</tr></thead>}<tbody>{list.map(row=>{const history=visitHistory(row),last=history.map(v=>v.date).sort().at(-1);if(row._blank)return <tr key={row.visitPlanId} data-design-alignment={row._alignmentKey} style={{height:44}}><td colSpan={3} style={{padding:0,border:0}}/></tr>;return <tr key={row.visitPlanId} data-design-alignment={row._alignmentKey} style={{height:row._designAction?44:undefined,background:row._designAction||compact?'#F3E6ED':undefined}}>{!compact&&<td style={{...tdStyle,padding:'4px 6px',lineHeight:1.25,textAlign:'left',fontSize:12,overflowWrap:'anywhere'}}>{!row._designAction&&<><button disabled={busy} aria-label={`Edit visit ${row.milestone} ${row.floor}`} title="Edit review and view visit history" onClick={()=>editReview(row)} style={{font:'inherit',fontWeight:600,border:0,background:'transparent',textAlign:'left',color:T.ink,cursor:'pointer',padding:0}}>{row.title||row.visitType||'Review'}</button>{!compact&&<div style={{fontSize:10,color:T.inkDim,marginTop:2}}>{visitWorkItems(row).join(' + ')}</div>}</>}</td>}<td style={{...tdStyle,padding:'4px 6px',lineHeight:1.25,fontSize:11}}>{!row._designAction&&visitFloors(row).map(f=><div key={f}>{f}</div>)}</td><td style={{...tdStyle,padding:'4px 6px',lineHeight:1.25,fontSize:11}}>{last&&<div title="Completed visit" style={{padding:'2px 5px',background:'#E8F2E9',color:'#245C2B',fontWeight:600,marginBottom:4}}>{formatProjectDate(last)}</div>}{row.scheduledDate&&<div title="Scheduled visit" style={{padding:'2px 5px',background:'#FFF4D6',color:'#7A5A00',fontWeight:600,marginBottom:4}}>{formatProjectDate(row.scheduledDate)}</div>}<div style={{display:'flex',gap:5,justifyContent:'center',alignItems:'center',flexWrap:'wrap'}}><button type="button" disabled={busy||row._draft} aria-label={`Schedule ${row.milestone} ${row.floor}`} title={row._draft?'Save the visit plan first':undefined} style={{...smallBtn,padding:'3px 5px',fontSize:9}} onClick={()=>openVisitAction(row,'schedule')}>{row.scheduledDate?'Reschedule':'Schedule'}</button><button disabled={busy||row._draft} title={row._draft?'Save the visit plan first':'Record visit minutes and completion date'} style={{...smallBtn,padding:'3px 5px',fontSize:9}} onClick={()=>openVisitAction(row,'record')}>Log MOM</button></div></td></tr>;})}</tbody></table></div>):null;
  return <section id="execution-visit-plan" style={{marginTop:0,fontFamily:FONT_BODY}}><div style={{display:'flex',gap:12,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap'}}><h3 style={{fontFamily:FONT_DISPLAY}}>{children?'Visit plan':'Execution and Task'}</h3>{!loading&&!loadError&&<div style={{display:'flex',gap:8}}>{rows.some(r=>r._draft)&&<Btn disabled={busy} onClick={()=>savePlan(rows,true)}>Save visit plan</Btn>}<Btn disabled={busy} onClick={()=>newReview()}>+ Add visit / review</Btn></div>}</div>
    {rows.some(r=>r._draft)&&<p style={{fontSize:12,color:T.inkDim}}>Default visit plan from your schedule. Review the floors and visit counts, then save once for this project to start logging visits.</p>}{notice&&<p role="status" style={{fontSize:12,color:T.inkDim}}>{notice}</p>}{loading&&<p role="status" style={{fontFamily:FONT_BODY,fontSize:12,fontWeight:400,lineHeight:1.5,color:T.inkDim,margin:'6px 0'}}>Updating visit plan…</p>}{(error||loadError)&&<p role="alert" style={{color:T.redline,fontSize:13}}>{error||loadError}</p>}
    {!rows.length&&!loading&&!loadError&&<p style={{fontSize:13,color:T.inkDim}}>Add a visit or review and choose the work stages and floors it covers.</p>}
    {children?children(renderVisitTable,renderDesignMeetingControls):renderVisitTable(rows)}

    {draft?.kind==='schedule'&&state?<div role="dialog" aria-modal="true" aria-label="Fix execution meeting" style={{position:'fixed',inset:0,zIndex:15000,background:'rgba(8,25,45,.45)',display:'flex',alignItems:'stretch',justifyContent:'flex-end'}}><div style={{background:T.paper,padding:20,width:600,maxWidth:'100%',height:'100%',overflowY:'auto',fontFamily:FONT_BODY}}><button style={smallBtn} onClick={()=>setDraft(null)}>Close</button><MeetingsView state={state} persist={persist} scheduleOnly initialProjectId={project.id} initialVisit={draft.row} onScheduled={async()=>{setDraft(null);onChange(activeVisits(await projectApi.listExecutionVisits(project.id)));}}/></div></div>:draft&&<div role="dialog" aria-modal="true" aria-label={draft.kind==='schedule'?'Schedule execution visit':draft.kind==='record'?'Log visit MOM':'Edit visit plan'} style={{position:'fixed',inset:0,zIndex:15000,background:'rgba(8,25,45,.45)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}><div style={{background:T.paper,padding:22,width:500,maxWidth:'100%',maxHeight:'90vh',overflowY:'auto'}}><h3>{draft.kind==='schedule'?'Schedule visit':draft.kind==='record'?'Log visit MOM': 'Edit visit / review'}</h3>{error&&<p role="alert" style={{color:T.redline}}>{error}</p>}{draft.kind==='schedule'?<><p>{draft.row.milestone} · {draft.row.floor}</p><Field label="Scheduled date"><input aria-label="Scheduled date" disabled={busy} type="date" value={draft.date} onChange={e=>setDraft(d=>({...d,date:e.target.value}))} style={inputStyle}/></Field></>:draft.kind==='record'?<><p>{draft.row.milestone} · {draft.row.floor}</p><MomDraftAssistant key={draft.visitId} projectId={project.id} row={draft.row} date={draft.date} visitBy={draft.visitBy} disabled={busy} onBusy={setAssisting} onUse={notes=>setDraft(d=>({...d,notes,taskText:d.taskText===undefined?momActionLines(notes).join('\n'):d.taskText}))}/>{[['Visit date','date','date'],['Visited by','visitBy','text'],['MOM / Discussion & actions','notes','text']].map(([label,key,type])=><Field key={key} label={label}>{key==='notes'?<textarea aria-label={label} disabled={busy} value={draft.notes} onChange={e=>setDraft(d=>({...d,notes:e.target.value}))} placeholder="Discussion, decisions, action items, owners and follow-up dates" style={{...inputStyle,minHeight:130,resize:'vertical'}}/>:<input aria-label={label} disabled={busy} type={type} value={draft[key]} onChange={e=>setDraft(d=>({...d,[key]:e.target.value}))} style={inputStyle}/> }</Field>)}<label style={{display:'block',fontFamily:FONT_BODY,fontSize:12,fontWeight:600,margin:'12px 0'}}>Action items & next steps<textarea aria-label="MOM dashboard action items" value={draft.taskText??momActionLines(draft.notes).join('\n')} disabled={busy||assisting} onChange={e=>setDraft(d=>({...d,taskText:e.target.value}))} style={{...inputStyle,fontSize:13,fontWeight:400,minHeight:110,marginTop:6,resize:'vertical'}}/></label><p style={{fontSize:11,color:T.inkDim}}>Each line becomes one dashboard task. Remove discussion-only points. Use “Follow-up:” for follow-ups; optionally add | owner | YYYY-MM-DD. Up to 40 items.</p></>:<><Field label="Visit title"><input aria-label="Visit title" disabled={busy} value={draft.row.title||''} placeholder="e.g. First Review, Second Review, Briefing" maxLength={160} onChange={e=>setDraft(d=>({...d,row:{...d.row,title:e.target.value}}))} style={inputStyle}/></Field><Field label="Review type"><input aria-label="Review type" disabled={busy} value={draft.row.visitType||''} placeholder="Briefing, Review, Briefing & Review…" onChange={e=>setDraft(d=>({...d,row:{...d.row,visitType:e.target.value}}))} style={inputStyle}/></Field><fieldset style={{border:`1px solid ${T.line}`,margin:'0 0 16px',padding:12}}><legend>Work covered</legend>{workOptions.map(work=><label key={work} style={{display:'flex',gap:7,alignItems:'center',fontSize:12,marginBottom:8}}><input type="checkbox" aria-label={`Visit work ${work}`} disabled={busy} checked={draft.row.workItems.includes(work)} onChange={e=>toggleCoverage('workItems',work,e.target.checked)}/>{work}</label>)}</fieldset><fieldset style={{border:`1px solid ${T.line}`,margin:'0 0 16px',padding:12}}><legend>Floors covered</legend><label style={{display:'block',fontSize:12,marginBottom:8}}><input type="checkbox" aria-label="Visit all floors" disabled={busy} checked={floorOptions.every(f=>draft.row.floors.includes(f))} onChange={e=>setDraft(d=>({...d,row:{...d.row,floors:e.target.checked?[...floorOptions]:[]}}))}/> Select all</label>{floorOptions.map(floor=><label key={floor} style={{display:'inline-flex',gap:6,margin:'0 14px 8px 0',fontSize:12}}><input type="checkbox" aria-label={`Visit floor ${floor}`} disabled={busy} checked={draft.row.floors.includes(floor)} onChange={e=>toggleCoverage('floors',floor,e.target.checked)}/>{floor}</label>)}</fieldset><Field label="Planned visits"><input aria-label="Planned visits" disabled={busy} type="number" min={1} max={100} value={draft.row.plannedVisits||1} onChange={e=>setDraft(d=>({...d,row:{...d.row,plannedVisits:e.target.value}}))} style={inputStyle}/></Field>{[['Weekly recurring visits','weekly'],['Essential','essential'],['Milestone closed','closed']].map(([label,key])=><label key={key} style={{display:'block',marginBottom:12}}><input disabled={busy} type="checkbox" checked={sheetDashboardFlag(draft.row[key])} onChange={e=>setDraft(d=>({...d,row:{...d.row,[key]:e.target.checked}}))}/> {label}</label>)}</>}
      {draft.kind==='plan'&&visitHistory(draft.row).length>0&&<section aria-label="Completed visit history"><h4>Visit history</h4>{visitHistory(draft.row).map(v=><div key={v.visitId} style={{padding:'8px 0',borderTop:`1px solid ${T.line}`,fontSize:12}}><strong>{formatProjectDate(v.date)}</strong> · {v.visitBy}{v.coveredWork&&<div style={{color:T.inkDim,marginTop:4}}>{v.coveredWork.join(' + ')} · {(v.coveredFloors||[]).join(', ')}</div>}{v.notes&&<p style={{margin:'5px 0',whiteSpace:'pre-wrap'}}>{v.notes}</p>}</div>)}</section>}
      {draft.kind==='plan'&&<button type="button" disabled={busy} style={{...smallBtn,color:T.redline,marginTop:12}} onClick={()=>removeReview(draft.row)}>Delete review</button>}
      <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:18}}><Btn variant="ghost" disabled={busy} onClick={()=>setDraft(null)}>Cancel</Btn><Btn disabled={busy||assisting||(draft.kind==='schedule'?!draft.date:draft.kind==='record'?(!draft.date||!draft.visitBy.trim()||!draft.notes.trim()):(!draft.row.workItems?.length||!draft.row.floors?.length))} onClick={draft.kind==='record'?record:draft.kind==='schedule'?()=>savePlan([{...draft.row,scheduledDate:draft.date}]):()=>savePlan([draft.row])}>{busy?'Saving…':'Save'}</Btn></div></div></div>}
  </section>;
}

const PROJECT_ONBOARDING_TASKS=[['folder','Folder Setup'],['sheet','Sheet Setup'],['zoning','Zoning & Keypad Location'],['technical','Technical Table Setup'],['zones','Zone Table with Area and Status']];
function ProjectOnboardingChecklist({project,state}){
 const cached=cachedWorkflowWorkspace(project.id),fromRows=rows=>Object.fromEntries((rows||[]).map(r=>[r.taskKey,{completed:r.completed===true||String(r.completed).toLowerCase()==='true',responsibleId:String(r.responsibleId||''),responsibleName:r.responsibleName||''}]));
 const [checks,setChecks]=useState(()=>fromRows(cached?.onboarding)),[pending,setPending]=useState({}),[loading,setLoading]=useState(!cached),[error,setError]=useState('');const live=useRef(true);
 const canEdit=state.currentUser?.appAccess?.toLowerCase()==='admin'||state.currentUser?.appAccess?.toLowerCase()!=='viewer'&&projectRole(state,project.id)==='Admin';
 const people=(state.teamMaster||[]).filter(m=>m.active!==false&&String(m.active).toLowerCase()!=='false'&&m.userId);
 useEffect(()=>{live.current=true;loadWorkflowWorkspace(project.id).then(data=>{if(live.current)setChecks(fromRows(data.onboarding));}).catch(e=>{if(live.current)setError(e.message);}).finally(()=>{if(live.current)setLoading(false);});return()=>{live.current=false;};},[project.id]);
 const change=async(key,patch)=>{const before=checks[key]||{};setChecks(all=>({...all,[key]:{...before,...patch}}));setPending(all=>({...all,[key]:true}));setError('');try{const saved=await apiRequest('saveProjectOnboarding',{projectId:project.id,taskKey:key,...patch},'POST',90000);if(live.current)setChecks(all=>({...all,[key]:{completed:saved.completed===true||String(saved.completed).toLowerCase()==='true',responsibleId:String(saved.responsibleId||''),responsibleName:saved.responsibleName||''}}));}catch(e){if(live.current){setChecks(all=>({...all,[key]:before}));setError('Checklist could not be saved. '+e.message);}}finally{if(live.current)setPending(all=>({...all,[key]:false}));}};
 const done=PROJECT_ONBOARDING_TASKS.filter(([key])=>checks[key]?.completed).length;
 if(!loading&&done===PROJECT_ONBOARDING_TASKS.length)return null;
 return <section aria-label="Project onboarding checklist" style={{border:`1px solid ${T.line}`,marginBottom:12,background:'#fff',fontFamily:FONT_BODY}}><div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:'#F3F1EA'}}><h3 style={{flex:1,margin:0,color:T.ink,fontFamily:FONT_DISPLAY,fontSize:14,fontWeight:700}}>Onboarding</h3><span style={{fontSize:11,color:T.inkDim}}>{done} / {PROJECT_ONBOARDING_TASKS.length} done</span></div><div style={{padding:'0 14px 12px',overflowX:'auto'}}><table style={{width:'100%',minWidth:450,borderCollapse:'collapse',fontSize:12}}><thead><tr><th style={{padding:'9px 6px',textAlign:'left',borderBottom:`1px solid ${T.line}`,fontFamily:FONT_MONO,fontSize:9,color:T.inkDim}}>Subtask</th><th style={{padding:'9px 6px',textAlign:'center',width:220,borderBottom:`1px solid ${T.line}`,fontFamily:FONT_MONO,fontSize:9,color:T.inkDim}}>Responsible person</th></tr></thead><tbody>{PROJECT_ONBOARDING_TASKS.filter(([key])=>!checks[key]?.completed).map(([key,label])=>{const item=checks[key]||{},disabled=loading||!canEdit||!!pending[key];return <tr key={key}><td style={{padding:'9px 6px',borderBottom:`1px solid ${T.line}`}}><label style={{display:'flex',alignItems:'center',gap:10}}><input type="checkbox" aria-label={label} checked={!!item.completed} disabled={disabled} onChange={e=>change(key,{completed:e.target.checked})} style={{width:17,height:17,accentColor:T.navy}}/><span style={{textDecoration:item.completed?'line-through':'none',color:item.completed?T.inkDim:T.ink}}>{label}</span></label></td><td style={{padding:'6px',textAlign:'center',borderBottom:`1px solid ${T.line}`}}><div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><WorkflowStatusDot status={loading?'Loading':item.completed?'Completed':'Pending'} label={loading?'Loading onboarding status':item.completed?'Completed':'Pending / Not started'}/>{canEdit?<select aria-label={`Responsible for ${label}`} disabled={disabled} value={item.responsibleId||''} onChange={e=>change(key,{responsibleId:e.target.value})} style={{...inputStyle,fontFamily:FONT_BODY,fontSize:12,padding:'5px 9px',width:'100%'}}><option value="">Unassigned</option>{item.responsibleId&&!people.some(p=>String(p.userId)===item.responsibleId)&&<option value={item.responsibleId}>{item.responsibleName||'Previous assignee'}</option>}{people.map(p=><option key={p.userId} value={p.userId}>{p.name}</option>)}</select>:item.responsibleName||'Unassigned'}</div>{pending[key]&&<span style={{fontSize:10,color:T.inkDim}}>Saving…</span>}</td></tr>;})}</tbody></table></div>{loading&&<p role="status" style={{fontSize:11,padding:'0 14px'}}>Loading checklist…</p>}{error&&<AppErrorNotice message={error}/>}</section>;
}

function ProjectLineOfWorkView({state,persist,selectedId,showProjectPicker=true}) {
  const projects = orderedProjects(state.projects);
  const [projectId,setProjectId] = useState(selectedId || projects.find(p=>!projectIsCompleted(p))?.id || projects[0]?.id || "");
  const project = projects.find(p => String(p.id) === String(projectId)) || projects[0];
  const [orderMode,setOrderMode]=useState('drawing');
  const initialWorkspace=cachedWorkflowWorkspace(project?.id);
  const [visits,setVisits]=useState(()=>initialWorkspace?.visits?activeVisits(initialWorkspace.visits):executionVisitDefaults(project).map(r=>({...r,_draft:true}))),[visitsLoading,setVisitsLoading]=useState(!initialWorkspace),[visitsError,setVisitsError]=useState('');
  const [rows,setRows] = useState(()=>applyWorkflowDelegation(initialWorkspace?.workflow?.length?initialWorkspace.workflow:DESIGN_TASK_FLOW_TEMPLATE.map(r=>({...r})),project?.id,initialWorkspace?.rules||[]));
  const [legacy,setLegacy] = useState([]);
  const [instances,setInstances] = useState([]);
  const [drawingReceipts,setDrawingReceipts]=useState(null);
  const [activationStates,setActivationStates]=useState({});
  const [editing,setEditing] = useState(false);
  const [busy,setBusy] = useState(false);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const [areaKey,setAreaKey] = useState("");
  const [message,setMessage] = useState("");
  const [savedRows,setSavedRows] = useState([]);
  const [panel,setPanel]=useState(null);
  const revision = useRef(0);
  const savePendingRef=useRef(false);
  const workflowProjectRef=useRef(project?.id);workflowProjectRef.current=project?.id;
  const rowId = r => String(r.lineWorkId || r.id);
  const setProjectRows = (all,delegationRules=[]) => {
    const workflow = all.filter(r => ["1","2"].includes(String(r.workflowVersion))).map(r => ({...r,id:r.lineWorkId || r.id}));
    const displayed=applyWorkflowDelegation(workflow.length?workflow:DESIGN_TASK_FLOW_TEMPLATE.map(r=>({...r})),project.id,delegationRules);
    setRows(displayed); setSavedRows(displayed);setOrderMode(displayed[0]?.workflowOrderMode==='manual'?'manual':'drawing'); setLegacy(all.filter(r => !["1","2"].includes(String(r.workflowVersion))));
  };
  useEffect(() => {
    let active = true; revision.current += 1;
    setEditing(false);setPanel(null);setAreaKey("");setError("");setMessage("");setInstances([]);
    if (!project) {setProjectRows([]);return;}
    const cached=cachedWorkflowWorkspace(project.id);setProjectRows(cached?.workflow||project.lineOfWorkResidence||project.lineOfWork||[],cached?.rules||[]);
    setLoading(!cached);
    loadWorkflowWorkspace(project.id).then(delegation=>{if(active)setProjectRows(Array.isArray(delegation.workflow)?delegation.workflow:[],delegation.rules||[]);}).catch(e=>{if(active)setError(`Could not update workflow: ${e.message||e}`);}).finally(()=>{if(active)setLoading(false);});
    projectApi.getWIH(true,project.id).then(wih=>{if(active)setInstances(Array.isArray(wih)?wih:[]);}).catch(e=>{if(active)setError(`Could not update work status: ${e.message||e}`);});
    return () => {active=false;};
  },[project?.id]);
  useEffect(()=>{let active=true;setDrawingReceipts(null);if(!project)return;loadWorkflowWorkspace(project.id).then(data=>{if(active)setDrawingReceipts(Array.isArray(data?.drawings)?data.drawings:[]);}).catch(()=>{if(active)setDrawingReceipts(undefined);});return()=>{active=false;};},[project?.id]);
  useEffect(()=>{let live=true;setVisitsError('');const cached=cachedWorkflowWorkspace(project?.id);setVisitsLoading(!cached);if(!project)return;loadWorkflowWorkspace(project.id).then(data=>{const rows=data.visits||[];if(live)setVisits(rows.length?activeVisits(rows):executionVisitDefaults(project).map(r=>({...r,_draft:true})));}).catch(e=>{if(live)setVisitsError(e.message);}).finally(()=>{if(live)setVisitsLoading(false);});return()=>{live=false;};},[project?.id]);
  if (!project) return <div style={{color:T.inkDim}}>No active project available.</div>;
  const members = (state.teamMaster || []).filter(m => m.active !== false && String(m.active)!=="false");
  const people = [...new Set([...members.map(m=>String(m.name||"")),...(state.people||[]).map(String),...rows.map(r=>String(r.responsible||""))].filter(Boolean))];
  const groups = pinWorkflowGroups(orderWorkflowGroups(workflowGroups(rows),orderMode,drawingReceipts,instances),orderMode);
  const aligned=alignWorkflowVisits(groups,designMeetingVisitRows(project,groups,visits));
  const zones = project.floorZones || Object.entries(project.zones || {}).map(([zoneCode,z])=>({zoneCode,floor:z.floor,area:z.room}));
  const areas = [...new Map([...zones,...instances.filter(w=>w.task?.area).map(w=>({floor:w.task.floor,area:w.task.area}))].filter(a=>a.floor&&a.area).map(a=>[JSON.stringify([String(a.floor),String(a.area)]),a])).entries()];
  const selectedArea = areas.find(([key])=>key===areaKey)?.[1];
  const mutate = (ids,patch) => setRows(rs=>rs.map(r=>ids.includes(rowId(r))?{...r,...patch}:r));
  const canMoveStage=(index,delta)=>{const target=groups[index+delta];if(!target)return false;const band=g=>{const value=workflowStageBand(g);return value===0||value===4?value:3;};return band(groups[index])===band(target);};
  const moveStage=(key,delta)=>{if(savePendingRef.current||loading)return;const list=[...groups],index=list.findIndex(g=>g.key===key),target=index+delta;if(!canMoveStage(index,delta))return;[list[index],list[target]]=[list[target],list[index]];setOrderMode('manual');return save({rows:list.flatMap(g=>g.rows),orderMode:'manual'});};
  const save = async options => {
    const draftRows=Array.isArray(options?.rows)?options.rows:rows,nextOrderMode=options?.orderMode||orderMode;
    if(savePendingRef.current)return;
    if(draftRows.some(r=>!String(r.milestone||'').trim()||!String(r.tasks||'').trim()||!String(r.subtask||'').trim()||!String(r.triggerTaskType||'').trim()))return setError('Each workflow row needs a milestone, task, subtask, and trigger task.');
    const token=revision.current,previousPanel=panel,previousSaved=savedRows;
    const before=state.projects.find(p=>p.id===project.id);
    const order={},clean=draftRows.map(r=>{const key=[r.milestone,r.tasks,r.triggerDrawingType,r.triggerTaskType,r.scope].join('|');order[key]=(order[key]||0)+1;return {...r,workflowOrderMode:nextOrderMode,workflowVersion:r.workflowVersion||'1',subtaskOrder:order[key],completionUploadRequired:r.completionUploadRequired!==false&&String(r.completionUploadRequired)!=='false',optional:r.optional===true||String(r.optional)==='true'};});
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
  const activationKey=r=>JSON.stringify([project.id,r.lineWorkId]);
  const workflowStatus=(task,sub)=>workflowActivationStatus(instances,task,sub,selectedArea,activationStates[activationKey(task)]);
  const cancelEdit=()=>{setRows(savedRows);setOrderMode(savedRows[0]?.workflowOrderMode==='manual'?'manual':'drawing');setEditing(false);setPanel(null);setMessage('');setError('');};
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
    {showProjectPicker&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:16}}>
      <div><h2 style={{fontFamily:FONT_DISPLAY,fontSize:20,margin:0}}>Design Line of Work</h2><div style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim,marginTop:5}}>Tasks and subtasks</div></div>
      {showProjectPicker&&<ProjectStatusSelect projects={projects} aria-label="Workflow project" disabled={busy||editing} style={{...fieldStyle,minWidth:280}} value={project.id} onChange={e=>setProjectId(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.no||"—"} · {p.name}</option>)}</ProjectStatusSelect>}
    </div>}
    {loading&&<div style={{color:T.inkDim,fontFamily:FONT_BODY,fontSize:13,lineHeight:1.5,marginBottom:12}}>Loading project workflow…</div>}
    {error&&<div role="alert" style={{padding:12,background:T.redlineBg,color:T.redline,marginBottom:12,fontFamily:FONT_BODY,fontSize:13,fontWeight:400,lineHeight:1.5}}>{error}</div>}
    {message&&<div role="status" style={{padding:12,background:T.paperDim,fontFamily:FONT_BODY,fontSize:13,fontWeight:400,lineHeight:1.5,marginBottom:12}}>{message}</div>}
    <>
      <ExecutionVisitPlanner key={project.id} project={project} state={state} persist={persist} rows={visits} onChange={next=>{if(workflowProjectRef.current===project.id)setVisits(activeVisits(next));}} loading={visitsLoading} loadError={visitsError}>{(renderVisitTable,renderDesignMeetingControls)=><>
      <div className="workflow-overview-layout"><aside aria-label="Project progress timeline" className="workflow-progress-rail">{(()=>{const stages=groups.map(g=>{const statuses=g.rows.map(r=>workflowWorkStatus(workflowStatus(g.first,r)).label);return {g,done:statuses.every(s=>s==='Completed'),active:statuses.some(s=>['In progress','Approval required'].includes(s))};});let current=stages.findIndex(s=>s.active);if(current<0)current=stages.findIndex(s=>!s.done);if(current<0)current=stages.length-1;return stages.map((stage,i)=><a key={stage.g.key} href={`#workflow-stage-${i}`} aria-label={`${stage.g.first.tasks}: ${stage.done?'completed':stage.active?'in progress':'not started'}`} aria-current={i===current?'step':undefined} title={stage.g.first.tasks} className="workflow-road-segment" style={{background:workflowSunsetSegment(i,stages.length)}}>{i===current&&<span aria-hidden="true" className="workflow-road-marker"/>}</a>);})()}</aside><div className="workflow-stage-comparison">
      {aligned.pairs.map(({group:g,visits:stageVisits},index)=>{const r=g.first,key=rowId(r),concept=workflowStageBand(g)===0;return <React.Fragment key={g.key}>{index===0&&<div className="workflow-comparison-headings"><h3>Design work</h3><h3>Execution and Task</h3></div>}<div className={concept&&!stageVisits.some(visit=>!String(visit.stage||'').startsWith('Design meeting: '))?"workflow-aligned-stage workflow-concept-stage":"workflow-aligned-stage"}><section id={`workflow-stage-${index}`} key={key} style={{border:`1px solid ${T.line}`,marginBottom:12,background:'#fff'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:'#F3F1EA'}}>
          {<div style={{display:'flex',gap:4}}><button type="button" title="Move stage up" aria-label={`Move ${r.tasks} earlier`} disabled={busy||loading||!canMoveStage(index,-1)} style={smallBtn} onClick={()=>moveStage(g.key,-1)}>↑</button><button type="button" title="Move stage down" aria-label={`Move ${r.tasks} later`} disabled={busy||loading||!canMoveStage(index,1)} style={smallBtn} onClick={()=>moveStage(g.key,1)}>↓</button></div>}<h3 style={{flex:1,margin:0,color:T.ink,fontFamily:FONT_DISPLAY,fontSize:14,fontWeight:700,display:'flex',alignItems:'center',gap:8}}>{r.tasks}</h3>
          <button type="button" disabled={busy||loading} aria-label={`Task details ${r.tasks}`} style={smallBtn} onClick={()=>setPanel({kind:'task',id:key})}>Task details</button>
        </div>
        {<div id={`workflow-subtasks-${key}`} style={{padding:'0 14px 12px'}}>
          <div style={{overflowX:'auto'}}><table id={`workflow-design-table-${project.id}-${key}`} aria-label={`Subtasks for ${r.tasks}`} style={{width:'100%',minWidth:400,tableLayout:'fixed',borderCollapse:'collapse',fontFamily:FONT_BODY}}><colgroup><col style={{width:'76%'}}/><col style={{width:'24%'}}/></colgroup><thead><tr>{['Subtask','Responsible person'].map((h,i)=><th key={h} style={{...thStyle,background:'#fff',color:T.inkDim,textAlign:i===0?'left':'center',fontFamily:FONT_MONO,fontSize:9,borderBottom:`1px solid ${T.line}`}}>{h}</th>)}</tr></thead>
            <tbody>{g.rows.map((sub,i)=><tr key={rowId(sub)} id={`workflow-design-row-${project.id}-${rowId(sub)}`} style={{height:44}}><td style={{...tdStyle,textAlign:'left',padding:'9px 6px'}}><button type="button" disabled={busy} aria-label={`Details ${sub.subtask}`} title="Open subtask details" onClick={()=>setPanel({kind:'subtask',id:rowId(sub)})} style={{border:0,background:'transparent',padding:0,fontFamily:FONT_BODY,fontSize:12,color:T.ink,textAlign:'left',cursor:'pointer',lineHeight:1.5}}><span style={{color:T.inkDim,marginRight:8,fontSize:11}}>{i+1}.</span>{sub.subtask}</button>{sub.taskCategory==='Meeting'&&renderDesignMeetingControls(meetingForDesignSubtask(project,g,sub,stageVisits),sub.meetingMode,loading)}</td><td style={{...tdStyle,textAlign:'center',verticalAlign:'middle',fontSize:12}}><span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8}}><WorkflowStatusDot {...workflowDotStatus(workflowStatus(r,sub),workflowPrerequisite(r,drawingReceipts,zones,selectedArea,instances))}/><span>{sub.responsible||r.responsible||'Unassigned'}</span></span></td></tr>)}</tbody>
          </table></div>
          {editing&&<button disabled={busy} style={{...smallBtn,marginTop:12}} onClick={()=>addSubtask(g)}>+ Add subtask</button>}
        </div>}
      </section><div className="workflow-execution-column" style={{minWidth:0}}>{renderVisitTable(stageVisits.filter(visit=>!String(visit.stage||'').startsWith('Design meeting: ')))}</div></div></React.Fragment>;})}
      {!!aligned.remaining.length&&<section className="workflow-final-execution" aria-label="Further execution work" style={{minWidth:0,marginTop:8}}><h3 style={{fontFamily:FONT_DISPLAY,fontSize:17}}>Execution and Task</h3>{renderVisitTable(aligned.remaining.filter(row=>!/staging|scene setting/i.test(row.milestone)))}{aligned.remaining.some(row=>/staging|scene setting/i.test(row.milestone))&&<section aria-label="Final staging and scene setting" style={{marginTop:22,border:`2px solid ${T.blue}`,background:'#E8F1F8'}}><h3 style={{margin:0,padding:'12px 14px',background:T.navy,color:'#fff',fontFamily:FONT_DISPLAY,fontSize:16}}>Staging & Scene Setting <span style={{fontFamily:FONT_MONO,fontSize:10,color:T.cyan,marginLeft:12}}>FINAL MILESTONE</span></h3>{renderVisitTable(aligned.remaining.filter(row=>/staging|scene setting/i.test(row.milestone)))}</section>}</section>}
      </div></div></>}</ExecutionVisitPlanner>
      <WorkflowStatusLegend/>
      {!!legacy.length&&<div style={{fontSize:11,color:T.inkDim,marginTop:12}}>{legacy.length} previous Line of Work rows retained.</div>}
    </>
    {panel&&panelRow&&<div role="dialog" aria-modal="true" aria-labelledby="workflow-editor-title" onKeyDown={e=>{if(e.key==='Escape'&&!busy){if(editing)cancelEdit();else setPanel(null);};if(e.key==='Tab'){const list=[...e.currentTarget.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),summary')];const first=list[0],last=list[list.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}} style={{position:'fixed',inset:0,zIndex:14500,background:'rgba(8,25,45,.4)',display:'flex',justifyContent:'flex-end'}}><div style={{width:520,maxWidth:'100%',height:'100%',background:T.paper,display:'flex',flexDirection:'column',boxShadow:'-8px 0 30px #08192d20',fontFamily:FONT_BODY}}>
      <div style={{padding:'18px 20px',borderBottom:`1px solid ${T.line}`,display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}><h3 id="workflow-editor-title" style={{fontFamily:FONT_DISPLAY,fontSize:18,margin:0}}>{panel.kind==='task'?'Task details':'Subtask details'}</h3><button type="button" autoFocus disabled={busy} aria-label="Close workflow details" style={smallBtn} onClick={editing?cancelEdit:()=>setPanel(null)}>Close</button></div>
      <div style={{padding:20,overflowY:'auto',flex:1}}>
        {error&&<p role="alert" style={{fontSize:13,color:T.redline}}>{error}</p>}
        {panel.kind==='task'?<>
          {panelField('Milestone','milestone')}{panelField('Task','tasks')}{panelField('Starting milestone','startingMilestone')}{panelField('Responsible','responsible','person')}<p style={{fontSize:12,color:T.inkDim}}>Status: {workflowStatus(panelRow)}</p>
          {!editing&&<section aria-label="Task activation and floor zones" style={{marginTop:20}}><h4 style={{fontFamily:FONT_DISPLAY,margin:'0 0 12px'}}>Activation · Floors & Zones</h4>
            {String(panelRow.workflowVersion)!=='2'&&panelRow.scope!=='Project'&&<label style={{display:'block',fontFamily:FONT_BODY,fontSize:12,marginBottom:12}}>Floor / Area<select aria-label="Workflow area" style={{...fieldStyle,marginTop:6}} value={areaKey} onChange={e=>setAreaKey(e.target.value)}><option value="">Choose a floor / area</option>{areas.map(([key,a])=><option key={key} value={key}>{a.floor} · {a.area}</option>)}</select></label>}
            {!panelRow.lineWorkId?<Btn disabled={busy||loading} onClick={save}>Save task setup</Btn>:String(panelRow.workflowVersion)==='2'?<StageActivationPanel key={project.id+':'+rowId(panelRow)} state={state} project={project} row={panelRow} disabled={busy||loading} onActivationState={status=>setActivationStates(x=>({...x,[activationKey(panelRow)]:{status}}))} onActivated={async task=>{
              if(workflowProjectRef.current!==project.id)return;
              const token=revision.current;
              if(task?.designTaskId)setInstances(list=>[...list.filter(w=>w.designTaskId!==task.designTaskId),{designTaskId:task.designTaskId,status:task.status,task}]);
              try{const list=await projectApi.getWIH(true,project.id);if(token===revision.current)setInstances(list);}catch(e){throw Error('Activation saved, but status refresh failed. Refresh the workflow to check it.');}
            }}/>:<Btn disabled={busy||loading} variant="ghost" onClick={()=>queue(panelGroup)}>{panelRow.scope==='Project'?'Queue project task':'Queue for selected area'}</Btn>}
          </section>}

          <details style={{marginTop:16,borderTop:`1px solid ${T.line}`,paddingTop:12}}><summary style={{cursor:'pointer',fontSize:13,fontWeight:600}}>More settings</summary><div style={{marginTop:16}}>{panelField('Scope','scope','scope')}{panelField('Required drawing','triggerDrawingType','drawing')}{panelField('Task started in WIH','triggerTaskType')}{panelRow.executionNote&&<p style={{fontSize:12,color:T.inkDim}}>Execution handoff: {panelRow.executionNote}</p>}</div></details>
        </>:<>
          {panelField('Subtask','subtask')}{panelField('Responsible','responsible','person')}
          <div style={{fontSize:12,color:T.inkDim,marginBottom:16}}>Status: {workflowStatus(panelGroup?.first||panelRow,panelRow)}</div>
          <details style={{borderTop:`1px solid ${T.line}`,paddingTop:12}}><summary style={{cursor:'pointer',fontSize:13,fontWeight:600}}>More settings</summary><div style={{marginTop:16}}>{panelField('Type','taskCategory','type')}{panelRow.taskCategory==='Meeting'&&panelField('Meeting mode','meetingMode','meeting')}{panelField('Estimated hours','hours','hours')}{panelField('Output required','completionUploadRequired','boolean')}{panelField('Optional','optional','boolean')}</div></details>
          {editing&&<button type="button" disabled={busy} onClick={()=>{if(window.confirm(`Remove ${panelRow.subtask} from this workflow draft?`)){setRows(rs=>rs.filter(r=>rowId(r)!==panel.id));setPanel(null);}}} style={{...smallBtn,color:T.redline,marginTop:24}}>Remove subtask</button>}
        </>}
      </div>
      <div style={{padding:'16px 20px',borderTop:`1px solid ${T.line}`,display:'flex',gap:8,justifyContent:'flex-end'}}><Btn variant="ghost" disabled={busy} onClick={editing?cancelEdit:()=>setPanel(null)}>{editing?'Cancel changes':'Back to overview'}</Btn>{editing?<Btn disabled={busy} onClick={save}>{busy?'Saving…':'Save Changes'}</Btn>:<Btn disabled={busy} onClick={()=>setEditing(true)}>Edit</Btn>}</div>
    </div></div>}
  </div>;
}

function ProjectSelector({ state, selectedId, setSelectedId }) {
  const project = state.projects.find(p => p.id === selectedId) || state.projects[0];
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>
    <div>
      <div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim,letterSpacing:".1em",textTransform:"uppercase",marginBottom:5}}>Selected Project</div>
      <ProjectStatusSelect projects={orderedProjects(state.projects)} value={project?.id || ""} onChange={e=>setSelectedId(e.target.value)} style={{...inputStyle,borderRadius:0,minWidth:320,fontFamily:FONT_DISPLAY,fontSize:16,fontWeight:700}}>
        {orderedProjects(state.projects).map(p=><option key={p.id} value={p.id}>{p.no || "—"} · {p.name}</option>)}
      </ProjectStatusSelect>
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
  if(statuses.some(s=>/^aligned$/.test(s))||records.some(r=>r.plannedStartDate)&&statuses.some(s=>/ready|not started|assigned/.test(s)))return 'Aligned';
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
function ProjectMomTasks({state,projectId,enabled=true,revision=0}){
  const [rows,setRows]=useState([]),[tab,setTab]=useState('Open'),[loading,setLoading]=useState(false),[error,setError]=useState(''),[leaving,setLeaving]=useState(new Set()),[pending,setPending]=useState(new Set()),[importing,setImporting]=useState(false),[reload,setReload]=useState(0);
  const alive=useRef(true),timers=useRef(new Set()),pendingIds=useRef(new Set());
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;timers.current.forEach(clearTimeout);};},[]);
  useEffect(()=>{let live=true;setError('');if(!enabled)return;setLoading(true);queueDesignDashboardLoad(()=>projectApi.listMomTasks(projectId)).then(list=>{if(live)setRows(current=>(Array.isArray(list)?list:[]).map(row=>pendingIds.current.has(row.momTaskId)?(current.find(r=>r.momTaskId===row.momTaskId)||row):row));}).catch(e=>{if(live)setError(e.message||'Could not load MOM tasks.');}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[projectId,enabled,revision,reload]);
  useEffect(()=>{const changed=e=>{if(String(e.detail?.projectId)===String(projectId))setReload(n=>n+1);};window.addEventListener?.('enlighten-mom-tasks-changed',changed);return()=>window.removeEventListener?.('enlighten-mom-tasks-changed',changed);},[projectId]);
  const viewer=state.currentUser?.appAccess?.toLowerCase()==='viewer',canWrite=!viewer&&!!projectRole(state,projectId),admin=!viewer&&projectRole(state,projectId)==='Admin';
  const done=r=>sheetDashboardFlag(r.completed);
  const update=async(row,patch)=>{
    if(pendingIds.current.has(row.momTaskId))return;
    pendingIds.current.add(row.momTaskId);setPending(new Set(pendingIds.current));setError('');
    const optimistic={...row,...patch,...(patch.completed===true?{completedAt:new Date().toISOString(),completedBy:state.currentUser?.name||state.currentUser?.email||''}:{}),...(patch.completed===false?{completedAt:'',completedBy:''}:{})};
    setRows(list=>list.map(r=>r.momTaskId===row.momTaskId?optimistic:r));
    if(patch.completed===true){setLeaving(ids=>new Set([...ids,row.momTaskId]));const timer=setTimeout(()=>{timers.current.delete(timer);if(alive.current)setLeaving(ids=>{const next=new Set(ids);next.delete(row.momTaskId);return next;});},650);timers.current.add(timer);}
    try{const saved=await projectApi.updateMomTask({projectId,momTaskId:row.momTaskId,...patch});if(alive.current)setRows(list=>list.map(r=>r.momTaskId===row.momTaskId?saved:r));}
    catch(e){if(alive.current){setRows(list=>list.map(r=>r.momTaskId===row.momTaskId?row:r));setLeaving(ids=>{const next=new Set(ids);next.delete(row.momTaskId);return next;});setError(`Could not save task: ${e.message} Its previous state is restored.`);}}
    finally{pendingIds.current.delete(row.momTaskId);if(alive.current)setPending(new Set(pendingIds.current));}
  };
  const importEarlier=async()=>{setImporting(true);setError('');try{const saved=await projectApi.importMomTasks(projectId);if(alive.current)setRows(saved);}catch(e){if(alive.current)setError(e.message);}finally{if(alive.current)setImporting(false);}};
  const visible=rows.filter(r=>tab==='Completed'?done(r):(!done(r)||leaving.has(r.momTaskId))&&(tab==='Follow-up'?r.kind==='Follow-up':r.kind!=='Follow-up'));
  const count=label=>rows.filter(r=>label==='Completed'?done(r):!done(r)&&(label==='Follow-up'?r.kind==='Follow-up':r.kind!=='Follow-up')).length;
  return <section aria-label="Project MOM tasks" style={{marginTop:20,border:`1px solid ${T.line}`,background:'#fff',fontFamily:FONT_BODY}}><div style={{padding:'10px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap',background:'#D2CDC1'}}><h3 style={{fontFamily:FONT_DISPLAY,fontSize:15,margin:0}}>MOM · Actions & Next Steps</h3><div style={{display:'flex',gap:7}}><button type="button" style={smallBtn} disabled={loading||!enabled||pending.size>0} onClick={()=>setReload(v=>v+1)}>Refresh tasks</button>{admin&&<button type="button" style={smallBtn} disabled={loading||importing||!enabled||pending.size>0} onClick={importEarlier}>{importing?'Importing…':'Import earlier MOM'}</button>}</div></div><div role="group" aria-label="MOM task views" style={{padding:10,display:'flex',gap:7,flexWrap:'wrap'}}>{['Open','Follow-up','Completed'].map(label=><button type="button" aria-pressed={tab===label} key={label} onClick={()=>setTab(label)} style={{...smallBtn,background:tab===label?T.navy:'#fff',color:tab===label?'#fff':T.blue}}>{label} ({count(label)})</button>)}</div>
    {error&&<p role="alert" style={{padding:'0 12px',fontSize:12,color:T.redline}}>{error}</p>}{loading&&<p style={{padding:'0 12px',fontSize:12,color:T.inkDim}}>Loading MOM tasks…</p>}
    {visible.map(row=><div key={row.momTaskId} style={{padding:'10px 12px',borderTop:`1px solid ${T.line}`,display:'flex',alignItems:'flex-start',gap:10,background:done(row)?'#F1F6F1':'#fff'}}><input type="checkbox" aria-label={`${done(row)?'Reopen':'Complete'} ${row.title}`} checked={done(row)} disabled={!canWrite||pending.has(row.momTaskId)} onChange={e=>update(row,{completed:e.target.checked})} style={{width:18,height:18,margin:'2px 0 0',flexShrink:0,accentColor:T.blue}}/><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,lineHeight:1.5,textDecoration:done(row)?'line-through':'none',color:done(row)?T.inkDim:T.ink}}>{row.title}</div><div style={{fontSize:11,color:T.inkDim,lineHeight:1.5,marginTop:3}}>{[row.milestone,row.floor,row.visitDate?`MOM ${formatProjectDate(row.visitDate)}`:'',row.owner?`Owner: ${row.owner}`:'',row.dueDate?`Due: ${formatProjectDate(row.dueDate)}`:''].filter(Boolean).join(' · ')}</div>{done(row)&&<div style={{fontSize:11,color:T.green,marginTop:3}}>Completed {formatProjectDate(row.completedAt)}{row.completedBy?` · ${row.completedBy}`:''}</div>}</div><div style={{display:'flex',alignItems:'center',gap:7}}>{pending.has(row.momTaskId)&&<span role="status" style={{fontSize:11,color:T.inkDim}}>Saving…</span>}{canWrite&&!done(row)&&<button type="button" disabled={pending.has(row.momTaskId)} style={smallBtn} onClick={()=>update(row,{kind:row.kind==='Follow-up'?'Open':'Follow-up'})}>{row.kind==='Follow-up'?'Move to Open':'Follow up'}</button>}</div></div>)}
    {!visible.length&&!loading&&<p style={{fontSize:12,color:T.inkDim,padding:'0 12px 10px'}}>{enabled?(tab==='Completed'?'No completed MOM tasks yet.':tab==='Follow-up'?'No follow-ups pending.':'No open MOM tasks. Action items from saved visit MOMs appear here.'):'Tasks load when this project comes into view.'}</p>}
  </section>;
}

function DrawingControlDashboard({state,projectId,deferLoad=false,heading,onEdit}){
  const project=(state.projects||[]).find(p=>String(p.id)===String(projectId));
  const [payload,setPayload]=useState(null),[wih,setWih]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[revision,setRevision]=useState(0);
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
  useEffect(()=>{let live=true;setPayload(null);setWih([]);setLoading(true);setError('');
    if(!project?.id){setLoading(false);return()=>{live=false;};}
    if(!ready)return()=>{live=false;};
    queueDesignDashboardLoad(()=>live?Promise.all([projectApi.getDesignDashboard(project.id),projectApi.getWIH(true,project.id)]):[null,[]]).then(([dashboard,work])=>{if(live){setPayload(dashboard);setWih(Array.isArray(work)?work:[]);}}).catch(e=>{if(live)setError(e.message||'Could not load dashboard data.');}).finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;};
  },[project?.id,revision,ready]);
  if(!project)return <p>No active project available.</p>;
  const eq=(a,b)=>String(a||'').trim().toLowerCase()===String(b||'').trim().toLowerCase();
  const allZones=(Array.isArray(payload?.floorZones)?payload.floorZones:project.floorZones||Object.entries(project.zones||{}).map(([zoneCode,z])=>({zoneCode,floor:z.floor,area:z.room}))).filter(z=>z.floor&&(z.area||z.room));
  const unique=[...new Map(allZones.map(z=>[JSON.stringify([z.floor,z.area||z.room]),z])).values()];
  const zones=unique;
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
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:6}}>{heading?<h2 style={{fontFamily:FONT_DISPLAY,margin:0,fontSize:22,color:T.ink}}>{heading}</h2>:<span/>}<div style={{display:'flex',gap:8,alignItems:'center'}}><button type="button" disabled={loading} style={{...smallBtn,padding:'5px 8px',fontSize:10}} onClick={()=>setRevision(x=>x+1)}>Refresh Dashboard</button>{onEdit&&<button type="button" onClick={onEdit} style={{...smallBtn,background:'#fff',padding:'5px 8px',fontSize:10}}>EDIT PROJECT</button>}</div></div>
    {error&&<p role="alert" style={{color:T.redline}}>{error}</p>}
    {loading&&<p role="status" style={{fontFamily:FONT_BODY,fontSize:11,fontWeight:400,lineHeight:1.4,color:'#77776F',margin:'3px 0 8px'}}>{ready?'Loading project drawings and WIH status…':'Details load as this project comes into view…'}</p>}
    <div ref={layoutRef} style={{display:'grid',gridTemplateColumns:showHours?'minmax(0,1fr) 330px':'minmax(0,1fr)',gap:showHours?16:0,alignItems:'start',width:'100%',minWidth:0}}>
      <div style={{minWidth:0,background:'#fff'}}>
        <table style={{width:'100%',borderCollapse:'collapse',marginBottom:8}}><tbody>{[[`Project ${project.no||project.projectNo||''}:`,project.name],['Start Date:',formatProjectDate(project.startDate)],['Time in hours:',loading?'Loading…':totalHours.toFixed(1)]].map(([label,value])=><tr key={label}><td style={{...cell,fontFamily:FONT_BODY,fontWeight:700,width:220}}>{label}</td><td style={{...cell,fontFamily:FONT_BODY}}>{label==='Time in hours:'?<div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}><span>{value}</span><button type="button" aria-label={`Hours by person for ${project.name}`} aria-expanded={showHours} aria-controls={`project-hours-${project.id}`} style={{...smallBtn}} onClick={()=>setShowHours(open=>!open)}>{showHours?'Hide hours by person':'Hours by person'}</button></div>:value}</td></tr>)}</tbody></table>

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

        <ProjectMomTasks key={project.id} state={state} projectId={project.id} enabled={ready} revision={revision}/>
      </div>
      {showHours&&<aside id={`project-hours-${project.id}`} aria-label="Hours by Person" style={{border:`1px solid ${T.line}`,background:'#fff',position:'sticky',top:0,minWidth:0}}><div style={{padding:12,borderBottom:`1px solid ${T.line}`,background:'#FAF9F5'}}><div style={{fontFamily:FONT_MONO,fontSize:9,fontWeight:700,marginBottom:8,background:'#D2CDC1',color:'#1C1C19',padding:'9px 10px',borderBottom:`2px solid ${T.ink}`}}>HOURS BY PERSON</div>{personHours.map(([person,hours])=><div key={person} style={{display:'flex',justifyContent:'space-between',gap:12,fontFamily:FONT_BODY,fontSize:11,padding:'4px 0'}}><span>{person}</span><strong>{hours.toFixed(1)} h</strong></div>)}{!personHours.length&&<div style={{fontFamily:FONT_BODY,fontSize:11,color:T.inkDim}}>{loading?'Loading hours…':'No completed WIH hours yet.'}</div>}</div></aside>}

    </div>
  </div>;
}

function ProjectCloseoutPanel({project,state,persist}){
 const initial=cachedWorkflowWorkspace(project.id)?.closeout,[data,setData]=useState(initial||{compiled:false,certificateSigned:false,responsibleId:'',responsibleName:'',files:[]}),[loading,setLoading]=useState(!initial),[busy,setBusy]=useState(false),[error,setError]=useState(''),[progress,setProgress]=useState(''),[retry,setRetry]=useState(null);const input=useRef(null),kind=useRef('AsBuilt'),jobs=useRef(new Map());
 const admin=state.currentUser?.appAccess?.toLowerCase()==='admin'||state.currentUser?.appAccess?.toLowerCase()!=='viewer'&&projectRole(state,project.id)==='Admin',canUpload=state.currentUser?.appAccess?.toLowerCase()!=='viewer',canCompleteTask=admin||!!state.currentUser?.userId&&String(state.currentUser.userId)===String(data.responsibleId),members=(state.teamMaster||[]).filter(m=>m.active!==false&&String(m.active).toLowerCase()!=='false'&&m.userId),flag=sheetDashboardFlag;
 useEffect(()=>{let live=true;loadWorkflowWorkspace(project.id).then(r=>{if(live&&r.closeout)setData(r.closeout);}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[project.id]);
 const save=async patch=>{const old=data;setData(d=>({...d,...patch}));setBusy(true);setError('');try{setData(await apiRequest('saveProjectCloseout',{projectId:project.id,...patch},'POST',90000));}catch(e){setData(old);setError(e.message);}finally{setBusy(false);}};
 const upload=async(kind,files)=>{if(!files.length||busy)return;setBusy(true);setError('');setRetry({kind,files});try{for(const file of files){if(!file.size||file.size>100*1024*1024)throw Error('Choose files up to 100 MB.');let entry=jobs.current.get(file);if(!entry||entry.kind!==kind){entry={kind,uploadId:'CLOSEOUT-'+uid()};jobs.current.set(file,entry);}setProgress(file.name+' · Preparing…');if(!entry.session)entry.session=await uploadApiRequest('beginCloseoutUpload',{projectId:project.id,uploadId:entry.uploadId,closeoutKind:kind,fileName:file.name,fileSize:file.size,mimeType:file.type||'application/octet-stream'},120000);if(!entry.session.file&&!entry.saved){const result=await transferDrawingToDrive(entry,file,p=>setProgress(file.name+' · '+p+'%'));entry.saved=await uploadApiRequest('finishCloseoutUpload',{completionTicket:result.completionTicket},120000);}}setData(await apiRequest('getProjectCloseout',{projectId:project.id},'GET',90000));setRetry(null);setProgress('');}catch(e){if(/expired|invalid.*session/i.test(e.message)){for(const entry of jobs.current.values()){entry.session=null;entry.completion=null;entry.directFailed=false;entry.transferStarted=false;}}setError(e.message);setProgress('');}finally{setBusy(false);}};
 const choose=value=>{kind.current=value;if(input.current){input.current.accept=value==='SitePictures'?'.jpg,.jpeg,.png,.webp,.heic,.heif':value==='Certificate'?'.pdf,.jpg,.jpeg,.png,.webp':'.pdf,.dwg,.dxf,.dwt,.dwf,.zip';input.current.multiple=value!=='Certificate';input.current.click();}};
 const files=value=>(data.files||[]).filter(f=>f.closeoutKind===value),ready=flag(data.compiled)&&flag(data.certificateSigned)&&['AsBuilt','Certificate','SitePictures'].every(value=>files(value).length>0);
 const complete=async()=>{setBusy(true);setError('');try{const row=await apiRequest('completeProjectCloseout',{projectId:project.id},'POST',120000);await persist(latest=>({...latest,projects:latest.projects.map(p=>p.id===project.id?backendProjectToFrontend(row,p):p)}));}catch(e){setError(e.message);}finally{setBusy(false);}};
 const links=value=><div style={{fontSize:11,marginTop:8}}>{files(value).map(f=><div key={f.fileId} style={{marginBottom:5}}><a href={f.driveUrl} target="_blank" rel="noopener noreferrer">{f.fileName}</a></div>)}</div>;
 return <section aria-label="Project Closeout" style={{marginTop:22,border:`1px solid ${T.line}`,background:'#fff',fontFamily:FONT_BODY}}><h3 style={{fontFamily:FONT_DISPLAY,fontSize:16,margin:0,padding:'12px 14px',background:T.navy,color:'#fff'}}>Project Closeout</h3><div style={{padding:14}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr>{['Task','Responsible person','Files'].map(h=><th key={h} style={{padding:9,textAlign:'left',background:'#D2CDC1'}}>{h}</th>)}</tr></thead><tbody><tr><td style={{padding:9,borderBottom:`1px solid ${T.line}`}}><label style={{display:'flex',alignItems:'center',gap:9}}><input type="checkbox" aria-label="Compile As-Built Drawings complete" checked={flag(data.compiled)} disabled={loading||busy||!canCompleteTask} onChange={e=>save({compiled:e.target.checked})} style={{width:18,height:18,accentColor:T.navy}}/>Compile As-Built Drawings</label></td><td style={{padding:9,borderBottom:`1px solid ${T.line}`}}><div style={{display:'flex',alignItems:'center',gap:8}}><WorkflowStatusDot status={flag(data.compiled)?'Completed':'Pending'} label={flag(data.compiled)?'Completed':'Pending'}/>{admin?<select aria-label="Responsible for Compile As-Built Drawings" style={{...inputStyle,fontSize:12}} value={data.responsibleId||''} disabled={loading||busy} onChange={e=>save({responsibleId:e.target.value})}><option value="">Unassigned</option>{data.responsibleId&&!members.some(m=>String(m.userId)===String(data.responsibleId))&&<option value={data.responsibleId}>{data.responsibleName||'Previous assignee'}</option>}{members.map(m=><option key={m.userId} value={m.userId}>{m.name}</option>)}</select>:data.responsibleName||'Unassigned'}</div></td><td style={{padding:9,borderBottom:`1px solid ${T.line}`}}>{canUpload&&<button type="button" disabled={busy||loading} style={smallBtn} onClick={()=>choose('AsBuilt')}>Upload As-Built Drawings</button>}{links('AsBuilt')}</td></tr></tbody></table><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:16,marginTop:16}}><div><button type="button" style={smallBtn} disabled={busy||loading||!canUpload} onClick={()=>choose('Certificate')}>Completion Certificate</button><p style={{fontSize:11,color:T.inkDim}}>Upload the signed completion certificate.</p>{links('Certificate')}<label style={{fontSize:12,display:'flex',alignItems:'center',gap:8}}><input type="checkbox" aria-label="Completion certificate signed" checked={flag(data.certificateSigned)} disabled={busy||loading||!admin||!files('Certificate').length} onChange={e=>save({certificateSigned:e.target.checked})}/>Signed certificate confirmed</label></div><div><button type="button" style={smallBtn} disabled={busy||loading||!canUpload} onClick={()=>choose('SitePictures')}>Site Pictures</button><p style={{fontSize:11,color:T.inkDim}}>Add the finished-site photographs.</p>{links('SitePictures')}</div></div><input type="file" ref={input} style={{display:'none'}} onChange={e=>{const selected=[...e.target.files];e.target.value='';upload(kind.current,selected);}}/>{loading&&<p role="status">Updating closeout…</p>}{progress&&<p role="status">{progress}</p>}{error&&<AppErrorNotice message={error}/>} {retry&&!busy&&<button type="button" style={smallBtn} onClick={()=>upload(retry.kind,retry.files)}>Retry upload</button>}{admin&&!projectIsCompleted(project)&&<div style={{marginTop:18,paddingTop:14,borderTop:`1px solid ${T.line}`}}><button type="button" disabled={busy||loading||!ready} style={{...smallBtn,background:ready?T.navy:T.paperDim,color:ready?'#fff':T.inkDim}} onClick={complete}>Mark Project Completed</button>{!ready&&<p style={{fontSize:11,color:T.inkDim}}>Complete the as-built task, upload the drawings and site pictures, and confirm the signed certificate to finish closeout.</p>}</div>}</div></section>;
}

function DesignWorkflowAccess({state,persist}){
 const [selected,setSelected]=useState(()=>state.projects?.find(p=>!projectIsCompleted(p))?.id||state.projects?.[0]?.id||'');
 const project=state.projects.find(p=>String(p.id)===String(selected))||state.projects[0];
 if(!project)return <p>No assigned project available.</p>;
 const scoped={...state,projects:[project]},canEdit=state.currentUser?.appAccess?.toLowerCase()==='admin'||projectRole(state,project.id)==='Admin'&&state.currentUser?.appAccess?.toLowerCase()!=='viewer';
 const saveScoped=update=>persist(latest=>{const scope={...latest,projects:latest.projects.filter(p=>p.id===project.id)},next=typeof update==='function'?update(scope):update;return {...latest,projects:latest.projects.map(p=>p.id===project.id?(next.projects.find(n=>n.id===p.id)||p):p)};});
 return <div data-design-line-of-work="true"><div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap',marginBottom:16}}><div><h2 style={{fontFamily:FONT_DISPLAY,fontSize:20,margin:0}}>Design Line of Work</h2><p style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim,margin:'5px 0 0'}}>Tasks and subtasks</p></div><ProjectStatusSelect projects={orderedProjects(state.projects)} aria-label="Line of Work assigned project" style={{...inputStyle,minWidth:280}} value={project.id} onChange={e=>setSelected(e.target.value)}>{orderedProjects(state.projects).map(p=><option key={p.id} value={p.id}>{p.no} · {p.name}</option>)}</ProjectStatusSelect></div><ProjectOnboardingChecklist key={'onboarding:'+project.id} project={project} state={state}/>{canEdit?<ProjectLineOfWorkView key={project.id} state={scoped} persist={saveScoped} selectedId={project.id} showProjectPicker={false}/>:<ReadOnlyProjectWork key={project.id} state={scoped} project={project}/>}<ProjectCloseoutPanel key={'closeout:'+project.id} project={project} state={state} persist={persist}/></div>;
}

function DesignWorkspaceView({state,persist}){
  const [tab,setTab]=useState('line');
  return <div><div role="tablist" aria-label="Design Dashboard sections" style={{display:'flex',borderBottom:`1px solid ${T.line}`,marginBottom:18,overflowX:'auto',background:'#fff'}}>{[['line','Line of Work'],['dashboard','Dashboard']].map(([id,label])=><button type="button" role="tab" key={id} id={`design-tab-${id}`} aria-selected={tab===id} aria-controls={`design-panel-${id}`} onClick={()=>setTab(id)} style={{padding:'11px 16px',border:0,borderBottom:`3px solid ${tab===id?T.cyan:'transparent'}`,background:tab===id?T.navy:'transparent',color:tab===id?'#fff':T.inkDim,cursor:'pointer',fontFamily:FONT_BODY,fontSize:12,fontWeight:tab===id?700:500,whiteSpace:'nowrap'}}>{label}</button>)}</div><div role="tabpanel" id={`design-panel-${tab}`} aria-labelledby={`design-tab-${tab}`}>{tab==='dashboard'?<DesignFlowView state={state} persist={persist}/>:<DesignWorkflowAccess state={state} persist={persist}/>}</div></div>;
}

function DesignFlowView({state,persist}){
  const [editId,setEditId]=useState(''),[projectDraft,setProjectDraft]=useState({}),[saving,setSaving]=useState(false),[error,setError]=useState('');
  const seen=new Set();
  const projects=orderedProjects(state.projects).filter(p=>{
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
    <header style={{marginBottom:14}}><h2 style={{fontFamily:FONT_DISPLAY,fontSize:26,margin:'0 0 12px'}}>System Design</h2><section aria-label="System Design values" style={{borderLeft:`3px solid ${T.blue}`,padding:'2px 0 2px 14px',maxWidth:1100}}><div style={{fontFamily:FONT_MONO,fontSize:10,fontWeight:700,letterSpacing:'.06em',color:T.blue,marginBottom:7}}>VALUES</div><p style={{fontFamily:FONT_BODY,fontSize:13,lineHeight:1.65,color:T.ink,margin:'0 0 12px',fontStyle:'italic'}}>Construction is not a one-day thing.<br/>It’s a process. It’s a year-long relationship. Sometimes even more.<br/>First of all, you should know what you’re doing; only then will you be able to drive on the right road.</p><p style={{fontFamily:FONT_BODY,fontSize:13,lineHeight:1.65,color:T.ink,margin:'0 0 6px',fontStyle:'italic'}}>Lighting is what is going to define the mood of the space.</p><div style={{fontFamily:FONT_BODY,fontSize:13,fontWeight:600,color:T.blue}}>Energetic&nbsp; | &nbsp;Relax&nbsp; | &nbsp;Focus</div></section></header>

    {projects.map((p,index)=><section key={p.id} aria-label={`Design dashboard ${p.name}`} style={{paddingBottom:18,marginBottom:18,borderBottom:`2px solid ${T.line}`}}>
      <DrawingControlDashboard state={state} projectId={p.id} deferLoad={index>0} heading={p.name} onEdit={canEditProject(p.id)?()=>openEdit(p):undefined}/>
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
      <Field label="Project"><ProjectStatusSelect projects={activeProjects} value={project.id} onChange={e=>setSelectedId(e.target.value)} style={{...inputStyle,borderRadius:0}}>{activeProjects.map(p=><option key={p.id} value={p.id}>{p.no||"—"} · {p.name}</option>)}</ProjectStatusSelect></Field>
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
          <div style={{fontFamily:FONT_BODY,fontSize:11}}>{m.participants||'—'}{m.workItems&&<div>{visitCoverageList(m.workItems,'').join(' + ')} · {visitCoverageList(m.floors,'').join(', ')}</div>}</div>
          <div style={{fontFamily:FONT_MONO,fontSize:10,color:m.happened?T.green:T.amber}}>{m.happened?"Meeting happened":"Scheduled / pending"}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10,paddingTop:10,borderTop:`1px solid ${T.line}`}}>
          <Field label="MOM"><textarea value={m.mom||""} onChange={e=>updateMeeting(m.id,{mom:e.target.value})} style={{...inputStyle,minHeight:78,borderRadius:0}} placeholder="Minutes / key decisions"/></Field>
          <Field label="Action Items"><textarea value={m.actionItems||""} onChange={e=>updateMeeting(m.id,{actionItems:e.target.value})} style={{...inputStyle,minHeight:78,borderRadius:0}} placeholder="Action · responsible person · due date"/></Field><button type="button" style={smallBtn} onClick={()=>saveMeetingNotes(m)}>Save MOM</button>
        </div>
      </div>)}
      {!projectMeetings.length&&<div style={{padding:18,border:`1px solid ${T.line}`,background:"#fff",fontFamily:FONT_BODY,fontSize:12,color:T.inkDim}}>No meetings for this project yet. Schedule them from Design Dashboard → Line of Work → Execution.</div>}
    </div>
  </div>;
}

function workflowDelegationKey(task,subtask){return JSON.stringify([String(task||'').trim().toLowerCase(),String(subtask||'').trim().toLowerCase()]);}
function applyWorkflowDelegation(rows,projectId,rules){return rows.map(row=>{if(row.delegationSource)return row;const key=workflowDelegationKey(row.tasks,row.subtask),project=rules.find(r=>String(r.projectId)===String(projectId)&&workflowDelegationKey(r.task,r.subtask)===key),base=rules.find(r=>r.projectId==='*'&&workflowDelegationKey(r.task,r.subtask)===key),raw=String(row.responsible||'').trim(),rule=project||(!raw?base:null);return {...row,responsible:rule?rule.responsibleName||'':raw,delegationSource:project?'project':raw?'project':base?'default':'none',delegationValue:rule?rule.responsibleName||'':raw,delegationRawResponsible:raw};});}
function WorkflowDelegationView({state,initialProjectId=''}){
 const admin=state.currentUser?.appAccess?.toLowerCase()==='admin',canManage=id=>admin||id&&projectRole(state,id)==='Admin'&&state.currentUser?.appAccess?.toLowerCase()!=='viewer';
 const [mode,setMode]=useState(initialProjectId?'project':'default'),[projectId,setProjectId]=useState(initialProjectId),[data,setData]=useState({rules:[],workflow:[]}),[draft,setDraft]=useState({}),[allPerson,setAllPerson]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const scope=mode==='default'?'':projectId,people=(state.teamMaster||[]).filter(m=>m.active!==false&&String(m.active).toLowerCase()!=='false'&&m.userId),editable=canManage(scope);
 useEffect(()=>{let live=true;setData({rules:[],workflow:[]});setDraft({});setMessage('');setError('');if(mode==='project'&&!projectId)return;setBusy(true);apiRequest('getWorkflowDelegation',{projectId:scope},'GET',90000).then(r=>{if(live)setData(r);}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setBusy(false);});return()=>{live=false;};},[mode,scope]);
 const onboarding=PROJECT_ONBOARDING_TASKS.map(([id,label])=>({id:'ON-'+id,tasks:'Onboarding',subtask:label})),source=data.workflow.some(r=>['1','2'].includes(String(r.workflowVersion)))?data.workflow.filter(r=>['1','2'].includes(String(r.workflowVersion))):DESIGN_TASK_FLOW_TEMPLATE;
 const seen=new Set(),rows=[...onboarding,...source,{id:'CLOSEOUT-ASBUILT',tasks:'Project Closeout',subtask:'Compile As-Built Drawings'}].filter(r=>{const key=workflowDelegationKey(r.tasks,r.subtask);if(!r.tasks||!r.subtask||seen.has(key))return false;seen.add(key);return true;});
 const entry=row=>{const key=workflowDelegationKey(row.tasks,row.subtask),own=data.rules.find(r=>String(r.projectId)===(scope||'*')&&workflowDelegationKey(r.task,r.subtask)===key),base=data.rules.find(r=>r.projectId==='*'&&workflowDelegationKey(r.task,r.subtask)===key);let value=own?.responsibleId??(mode==='default'?'':'__inherit__');if(!own&&mode==='project'&&row.delegationSource==='project'&&row.responsible)value=String(people.find(p=>p.name===row.responsible)?.userId||'');return {key,value:draft[key]??value,base:base?.responsibleName||'Unassigned'};};
 const save=async()=>{if(!editable||busy)return;const changed=rows.filter(r=>Object.prototype.hasOwnProperty.call(draft,workflowDelegationKey(r.tasks,r.subtask)));if(!changed.length)return;setBusy(true);setError('');setMessage('');try{await apiRequest('saveWorkflowDelegation',{projectId:scope,rows:changed.map(r=>{const value=draft[workflowDelegationKey(r.tasks,r.subtask)];return {task:r.tasks,subtask:r.subtask,inherit:value==='__inherit__',responsibleId:value==='__inherit__'?'':value};})},'POST',120000);setData(await apiRequest('getWorkflowDelegation',{projectId:scope},'GET',90000));setDraft({});setMessage('Delegation saved. Line of Work will use these assignments when opened.');}catch(e){setError(e.message);}finally{setBusy(false);}};
 return <section style={{fontFamily:FONT_BODY}}><h2 style={{fontFamily:FONT_DISPLAY,fontSize:20}}>Delegation</h2><div style={{display:'flex',gap:8,marginBottom:14}}>{[['default','Default workflow'],['project','Project-wise']].map(([id,label])=><button key={id} type="button" disabled={busy||Object.keys(draft).length>0} style={{...smallBtn,background:mode===id?T.navy:T.paper,color:mode===id?'#fff':T.ink}} onClick={()=>setMode(id)}>{label}</button>)}</div>{mode==='project'&&<ProjectStatusSelect projects={orderedProjects(state.projects)} disabled={busy||!!initialProjectId||Object.keys(draft).length>0} aria-label="Delegation project" style={inputStyle} value={projectId} onChange={e=>setProjectId(e.target.value)}><option value="">Select a project</option>{orderedProjects(state.projects).map(p=><option key={p.id} value={p.id}>{p.no} · {p.name}</option>)}</ProjectStatusSelect>}<p style={{fontSize:12,color:T.inkDim}}>{mode==='default'?'Default assignments apply across projects unless a project has its own assignee.':'Choose Use default to inherit the default person, or select a project-specific assignee. Line of Work edits also become project overrides.'}</p>{(mode==='default'||projectId)&&<>{editable&&<div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}><select aria-label="Assign complete workflow" disabled={busy} value={allPerson} onChange={e=>setAllPerson(e.target.value)} style={{...inputStyle,width:250}}><option value="">Select person for complete workflow</option>{people.map(p=><option key={p.userId} value={p.userId}>{p.name}</option>)}</select><button type="button" disabled={busy||!allPerson} style={smallBtn} onClick={()=>setDraft(Object.fromEntries(rows.map(r=>[workflowDelegationKey(r.tasks,r.subtask),allPerson])))}>Assign complete workflow</button><button type="button" disabled={busy||!Object.keys(draft).length} style={{...smallBtn,background:T.navy,color:'#fff'}} onClick={save}>{busy?'Saving…':'Save Changes'}</button>{Object.keys(draft).length>0&&<button type="button" disabled={busy} style={smallBtn} onClick={()=>setDraft({})}>Discard changes</button>}</div>}{!editable&&<p style={{fontSize:12,color:T.inkDim}}>{mode==='default'?'Default delegation is managed by System Admin.':'Project Admin manages project delegation.'}</p>}{busy&&<p role="status" style={{fontSize:12}}>Loading / saving delegation…</p>}{error&&<AppErrorNotice message={error}/>}<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr>{['Task','Subtask','Responsible person'].map(h=><th key={h} style={{padding:10,textAlign:'left',background:'#D2CDC1'}}>{h}</th>)}</tr></thead><tbody>{rows.map(row=>{const item=entry(row);return <tr key={item.key}><td style={{padding:9,borderBottom:`1px solid ${T.line}`}}>{row.tasks}</td><td style={{padding:9,borderBottom:`1px solid ${T.line}`}}>{row.subtask}</td><td style={{padding:7,borderBottom:`1px solid ${T.line}`,minWidth:230}}><select aria-label={`Delegate ${row.tasks}: ${row.subtask}`} disabled={busy||!editable} value={item.value} style={{...inputStyle,fontSize:12}} onChange={e=>setDraft(d=>({...d,[item.key]:e.target.value}))}>{mode==='project'&&<option value="__inherit__">Use default · {item.base}</option>}<option value="">Unassigned</option>{item.value&&!['__inherit__'].includes(item.value)&&!people.some(p=>String(p.userId)===String(item.value))&&<option value={item.value}>Previous assignee</option>}{people.map(p=><option key={p.userId} value={p.userId}>{p.name}</option>)}</select></td></tr>;})}</tbody></table></div></>}{message&&<p role="status" style={{fontSize:12}}>{message}</p>}</section>;
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
  const projectEditorRef=useRef(null);
  const [editorReveal,setEditorReveal]=useState(0);
  useEffect(()=>{
    if(!editorReveal||!isProjectEditorOpen)return;
    const panel=projectEditorRef.current;if(!panel)return;
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    panel.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});
    panel.focus({preventScroll:true});
    if(!reduced)panel.animate?.([{boxShadow:'0 0 0 0 rgba(72,159,197,0)',transform:'translateY(7px)'},{boxShadow:'0 0 0 5px rgba(72,159,197,.22)',transform:'translateY(0)'},{boxShadow:'0 0 0 0 rgba(72,159,197,0)',transform:'translateY(0)'}],{duration:750,easing:'ease-out'});
  },[editorReveal,isProjectEditorOpen]);
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
  const ongoingProjects = orderedProjects(state.projects).filter(p=>!isCompletedProject(p));
  const completedProjects = orderedProjects(state.projects).filter(isCompletedProject);
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

  const openProjectEditor = (p,button) => {
    if(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)button?.animate?.([{transform:'scale(1)'},{transform:'scale(.92)',background:'#E6EEF4'},{transform:'scale(1)'}],{duration:220,easing:'ease-out'});
    setEditorReveal(n=>n+1);
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

  const projectEditor = project && editDraft && isProjectEditorOpen && <div ref={projectEditorRef} tabIndex={-1} role="region" aria-label="Edit selected project" style={{scrollMarginTop:24,outline:"none",marginTop:16,border:`2px solid ${T.navy}`,background:"#fff",padding:16}}>
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
      </div>;

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>
      <div>
        <h2 style={{fontFamily:FONT_DISPLAY,fontSize:22,margin:0,color:T.ink}}>Projects & Scope of Work</h2>
        <div style={{fontFamily:FONT_BODY,fontSize:13,color:T.inkDim,marginTop:4}}>
          One master sheet: project information and project scope are edited together.
        </div>
      </div>
      <div style={{display:"flex",gap:8}}><button onClick={()=>{setShowExistingProjects(true);setShowNewProject(false);if(project)openProjectEditor(project);}} style={smallBtn}>Existing Projects</button>
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
      <ProjectOnboarding key={showNewProject ? "new" : "browse"} initialMode={showNewProject ? "new" : "browse"} state={state} persist={persist} selectedId={selectedId} projectEditor={showExistingProjects?(projectEditor||<p style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim}}>Select a project to open its complete details.</p>):null} setSelectedId={(id)=>{setSelectedId(id);setShowNewProject(false);setTab("list");if(showExistingProjects){const chosen=state.projects.find(p=>p.id===id);if(chosen)openProjectEditor(chosen);}}}/>
    </div>}

    <div style={{display:"flex",alignItems:"center",gap:0,borderBottom:`1px solid ${T.line}`,marginBottom:18,overflowX:"auto",background:"#fff"}}>
      {[["list","Projects & Scope"],["team","Directory"],["delegation","Delegation"]].map(([id,label])=>
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
          {project && !isCompletedProject(project) && <button type="button" onClick={e=>openProjectEditor(project,e.currentTarget)} style={{...smallBtn,border:`1px solid ${T.blue}`,color:T.blue,background:"#fff"}}>Edit Selected Project</button>}
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
                    onClick={(e)=>{e.stopPropagation();openProjectEditor(p,e.currentTarget);}}
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

      {!showExistingProjects && projectEditor}

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

    {tab==="team"&&<ProjectDirectory state={state} persist={persist}/>}{tab==="delegation"&&<WorkflowDelegationView state={state}/>}
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
function MeetingsView({ state, persist, scheduleOnly=false, initialProjectId, initialVisit, onScheduled }) {
  const activeProjects=(state.projects||[]).filter(p=>p.status!=="Completed"&&p.projectControl?.projectStatus!=="Completed");
  const existingMeeting=initialVisit?(state.meetings||[]).find(m=>m.projectId===initialProjectId&&m.visitPlanId===initialVisit.visitPlanId&&!sheetDashboardFlag(m.happened)&&m.active!==false):null;
  const [form,setForm]=useState({id:existingMeeting?.id||uid(),projectId:initialProjectId||activeProjects[0]?.id||"",visitPlanId:initialVisit?.visitPlanId||"",date:initialVisit?.scheduledDate||todayISO(),time:"10:00",title:initialVisit?.title||initialVisit?.visitType||"",participants:"",meetingMode:"Physical on-site meeting",location:"",agenda:"",happened:false,mom:"",actionItems:"",nextDate:"",...(existingMeeting||{}),workItems:initialVisit?visitWorkItems(initialVisit):[],floors:initialVisit?visitFloors(initialVisit):[]});
  const [openMomId,setOpenMomId]=useState(null);
  const [meetingBusy,setMeetingBusy]=useState(false),[meetingError,setMeetingError]=useState('');
  const [coverageWorkspace,setCoverageWorkspace]=useState(()=>cachedWorkflowWorkspace(initialProjectId));
  useEffect(()=>{let live=true;if(initialVisit&&form.projectId)loadWorkflowWorkspace(form.projectId).then(data=>{if(live)setCoverageWorkspace(data);}).catch(()=>{});return()=>{live=false;};},[form.projectId,initialVisit?.visitPlanId]);
  const workChoices=[...new Set(['False Ceiling','Wiring','Bathroom Stone','Furniture','Facade','Finalise Architectural Lighting','Wall Electrical','Control Finalisation','Ceiling Pack | Moulding Sampling & Review','Marking | Cutting','Light Installation','Snag List','Staging and Scene Setting',...(coverageWorkspace?.visits||[]).flatMap(visitWorkItems),...(coverageWorkspace?.workflow||[]).map(r=>r.tasks),...(initialVisit?visitWorkItems(initialVisit):[]),...form.workItems].filter(Boolean))];
  const floorChoices=[...new Set([...(state.projects.find(p=>p.id===form.projectId)?.floorZones||[]).map(z=>z.floor),...Object.values(state.projects.find(p=>p.id===form.projectId)?.zones||{}).map(z=>z.floor),...(coverageWorkspace?.visits||[]).flatMap(visitFloors),...(initialVisit?visitFloors(initialVisit):[]),...form.floors].filter(Boolean))];
  const projectName=id=>state.projects.find(p=>p.id===id)?.name||"—";

  const saveMeeting=async meeting=>{
    if(meetingBusy)return false;setMeetingBusy(true);setMeetingError('');
    try{const saved=await projectApi.saveProjectMeeting({...meeting,...(initialVisit?._designMeeting?{visitSeed:initialVisit}:{})});await persist(latest=>({...latest,meetings:[saved,...(latest.meetings||[]).filter(m=>m.id!==saved.id)]}));return true;}
    catch(e){setMeetingError(e.message);return false;}finally{setMeetingBusy(false);}
  };
  const addMeeting=async()=>{
    if(!form.title.trim()||!form.projectId)return;
    const saved=await saveMeeting({id:uid(),...form,title:form.title.trim()});
    if(saved&&onScheduled){try{await onScheduled();}catch(e){setMeetingError('Meeting saved. Refresh Line of Work to see the updated schedule.');}return;}
    if(saved)setForm(current=>({...current,id:uid(),title:'',agenda:'',participants:'',location:'',happened:false,nextDate:''}));
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
  const nowKey=todayISO();
  const meetings=[...(state.meetings||[])].sort((a,b)=>`${b.date||""} ${b.time||""}`.localeCompare(`${a.date||""} ${a.time||""}`));
  const upcoming=meetings.filter(m=>!sheetDashboardFlag(m.happened)&&(m.date||"")>=nowKey);
  const past=meetings.filter(m=>sheetDashboardFlag(m.happened)||(m.date||"")<nowKey);

  return <div>
    <div style={{marginBottom:16}}>{!scheduleOnly&&<button type="button" disabled={meetingBusy} onClick={refreshMeetings} style={{...smallBtn,float:'right'}}>Refresh meetings</button>}<h2 style={{fontFamily:FONT_DISPLAY,fontSize:20,margin:'0 0 5px',color:T.ink}}>{scheduleOnly?'Schedule meeting':'Meetings'}</h2>{scheduleOnly?<p style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim,margin:0}}>{projectName(form.projectId)}</p>:<p style={{fontFamily:FONT_BODY,fontSize:12,color:T.inkDim,margin:0}}>Upcoming and past meetings.</p>}</div>
    {scheduleOnly&&<div style={{fontFamily:FONT_BODY}}>
      {!initialProjectId&&<Field label="Project"><ProjectStatusSelect projects={activeProjects} style={inputStyle} value={form.projectId} onChange={e=>setForm({...form,projectId:e.target.value})}>{activeProjects.map(p=><option key={p.id} value={p.id}>{p.no} — {p.name}</option>)}</ProjectStatusSelect></Field>}
      <Field label="Subject"><input aria-label="Meeting subject" style={inputStyle} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></Field>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10}}><Field label="Date"><input aria-label="Meeting date" type="date" style={inputStyle} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></Field><Field label="Time"><input aria-label="Meeting time" type="time" style={inputStyle} value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></Field></div>
      <Field label="Meeting format"><select aria-label="Meeting format" disabled={meetingBusy} style={inputStyle} value={form.meetingMode||'Physical on-site meeting'} onChange={e=>setForm(f=>({...f,meetingMode:e.target.value,location:''}))}><option value="Physical on-site meeting">Physical on-site meeting</option><option value="Zoom call">Zoom call</option></select></Field>
      <Field label={form.meetingMode==='Zoom call'?'Zoom meeting link':'On-site location'}><input aria-label={form.meetingMode==='Zoom call'?'Zoom meeting link':'On-site location'} placeholder={form.meetingMode==='Zoom call'?'Paste Zoom link (optional)':'Site address / meeting point (optional)'} style={inputStyle} value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></Field>
      {initialVisit&&<details aria-label="Combined meeting coverage" style={{border:`1px solid ${T.line}`,padding:12,marginBottom:14}}><summary style={{cursor:'pointer',fontFamily:FONT_BODY,fontSize:12,fontWeight:600}}>Work & floors · {form.workItems.join(' + ')||'Choose work'} · {form.floors.join(', ')||'Choose floors'}</summary><p style={{fontSize:12,color:T.inkDim,margin:'9px 0'}}>Select multiple work stages and floors for one visit.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10}}>{[['Work stages','workItems',workChoices],['Floors','floors',floorChoices]].map(([label,key,options])=><fieldset key={key} style={{border:`1px solid ${T.line}`,padding:10,maxHeight:190,overflowY:'auto'}}><legend style={{fontFamily:FONT_BODY,fontSize:12}}>{label}</legend>{options.map(value=><label key={value} style={{display:'flex',alignItems:'center',gap:8,fontFamily:FONT_BODY,fontSize:12,marginBottom:7}}><input type="checkbox" aria-label={`Meeting ${key} ${value}`} checked={form[key].includes(value)} onChange={e=>setForm(f=>({...f,[key]:e.target.checked?[...new Set([...f[key],value])]:f[key].filter(v=>v!==value)}))}/>{value}</label>)}</fieldset>)}</div></details>}
      <details style={{border:`1px solid ${T.line}`,padding:12,marginBottom:16}}><summary style={{cursor:'pointer',fontFamily:FONT_BODY,fontSize:12,fontWeight:600}}>Participants & agenda (optional)</summary><div style={{marginTop:12}}><Field label="Participants"><input aria-label="Meeting participants" style={inputStyle} value={form.participants} onChange={e=>setForm({...form,participants:e.target.value})}/></Field><Field label="Agenda"><textarea aria-label="Meeting agenda" style={{...inputStyle,minHeight:75}} value={form.agenda} onChange={e=>setForm({...form,agenda:e.target.value})}/></Field></div></details>
      {meetingError&&<AppErrorNotice message={meetingError}/>}<Btn onClick={addMeeting} disabled={meetingBusy||!form.projectId||!form.title.trim()||!!initialVisit&&(!form.workItems.length||!form.floors.length)}><CalendarDays size={14}/>{meetingBusy?'Saving…':'Save meeting'}</Btn>
    </div>}

    {!scheduleOnly&&<>
    {meetingError&&<p role="alert" style={{color:T.redline,fontFamily:FONT_BODY,fontSize:13}}>{meetingError}</p>}
    <div style={{fontFamily:FONT_MONO,fontSize:10,fontWeight:700,letterSpacing:".08em",marginBottom:8}}>UPCOMING / SCHEDULED</div>
    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
      {upcoming.map(m=><div key={m.id} style={{background:"#fff",border:`1px solid ${T.line}`,padding:12}}>
        <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr auto auto",gap:10,alignItems:"center"}}>
          <div><strong style={{fontFamily:FONT_DISPLAY,fontSize:14}}>{m.title}</strong><div style={{fontFamily:FONT_MONO,fontSize:10,color:T.inkDim,marginTop:3}}>{projectName(m.projectId)} · {m.date} {m.time} · {m.location||"—"}</div></div>
          <div style={{fontFamily:FONT_BODY,fontSize:11,color:T.inkDim}}>{m.participants||'—'}{m.meetingMode&&<div>{m.meetingMode}{m.location?' · '+m.location:''}</div>}{m.workItems&&<div>{visitCoverageList(m.workItems,'').join(' + ')} · {visitCoverageList(m.floors,'').join(', ')}</div>}</div>
          <button disabled={meetingBusy||!!m.visitPlanId&&projectRole(state,m.projectId)!=="Admin"} onClick={()=>updateMeeting(m.id,{happened:true})} style={{...smallBtn}}>Mark Happened</button>
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
          <div style={{fontFamily:FONT_BODY,fontSize:11,color:T.inkDim}}>{m.participants||'—'}{m.meetingMode&&<div>{m.meetingMode}{m.location?' · '+m.location:''}</div>}{m.workItems&&<div>{visitCoverageList(m.workItems,'').join(' + ')} · {visitCoverageList(m.floors,'').join(', ')}</div>}</div>
          <button onClick={()=>setOpenMomId(openMomId===m.id?null:m.id)} style={{...smallBtn}}>{openMomId===m.id?"Hide MOM":"View MOM"}</button>
        </div>
        {openMomId===m.id&&<div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${T.line}`,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><div style={{fontFamily:FONT_MONO,fontSize:9,fontWeight:700,marginBottom:5}}>MOM</div><div style={{fontFamily:FONT_BODY,fontSize:11,lineHeight:1.5,whiteSpace:"pre-wrap"}}>{m.mom||"No MOM entered yet. Log MOM from Design Dashboard → Line of Work → Execution."}</div></div>
          <div><div style={{fontFamily:FONT_MONO,fontSize:9,fontWeight:700,marginBottom:5}}>ACTION ITEMS</div><div style={{fontFamily:FONT_BODY,fontSize:11,lineHeight:1.5,whiteSpace:"pre-wrap"}}>{m.actionItems||"—"}</div></div>
        </div>}
      </div>)}
      {!past.length&&<div style={{padding:14,border:`1px solid ${T.line}`,background:"#fff",fontFamily:FONT_BODY,fontSize:12,color:T.inkDim}}>No past meetings yet.</div>}
    </div>
    </>}
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
        {!active ? <><Field label="Project"><ProjectStatusSelect projects={orderedProjects(state.projects)} style={inputStyle} value={projectId} onChange={e=>setProjectId(e.target.value)}>{orderedProjects(state.projects).map(p=><option key={p.id} value={p.id}>{p.no} — {p.name}</option>)}</ProjectStatusSelect></Field>
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
  { id: "drawingRegister", label: "Received / Sent", icon: FileText, group: "RECEIVED / SENT" },
  { id: "classify", label: "Classify", icon: ClipboardCheck, group: "RECEIVED / SENT" },
  { id: "drive", label: "Drive", icon: FolderOpen, group: "RECEIVED / SENT" },
  { id: "timesheet", label: "WIH Sheet", icon: Clock, group: "WIH SHEET" },
  { id: "technicalTable", label: "Technical Table", icon: FileText, group: "WIH SHEET" },
  { id: "executionMain", label: "Execution Dashboard", icon: HardHat, group: "WIH SHEET" },
  { id: "site", label: "Site Punch-in", icon: MapPin, group: "SITE PUNCH-IN" },
  { id: "settings", label: "Team & Tasks", icon: Settings2, group: "ADMIN" },
  { id: "performance", label: "Performance", icon: Clock, group: "ADMIN" },
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
  const ids=user?.appAccess?.toLowerCase()==='viewer'?['project','design','drawingRegister','drive','timesheet','technicalTable','site','performance']:['project','design','dashboard','classify','drawingRegister','drive','timesheet','technicalTable','site','performance'];
  return NAV.filter(n=>ids.includes(n.id));
}

function StudioApp() {
  const { state, loading, saveErr, backendErr, currentUser, persist } = useStudioState();
  const [view, setView] = useState("project");
  const [showWihMeetings,setShowWihMeetings]=useState(false);

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

  if(currentUser?.appAccess==='Contractor')return <ContractorDrawingPortal user={currentUser}/>;
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
        <TitleBlock view={viewLabel} sub={view === "timesheet" ? `${state.tasks.length} tasks` : view === "classify" ? `${pendingCount} pending` : view === "project" ? "Onboarding · Scope · Team" : view === "design" ? "Dashboard · Line of Work" : view === "meetings" ? `${(state.meetings || []).length} meetings` : view === "executionMain" ? "Milestones · MOM" : view === "site" ? `${(state.siteVisits || []).length} site visits` : undefined} />
        {view!=='upload'&&(state.pendingReceivedUploads||[]).length>0&&<div role="status" style={{padding:'8px 24px',fontFamily:FONT_BODY,fontSize:12,background:T.amberBg,color:T.ink}}>{state.pendingReceivedUploads.length} drawing upload(s) pending. <button type="button" style={smallBtn} onClick={()=>setView('drawingRegister')}>View uploads</button></div>}
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
          {allowedNav.some(n=>n.id==="design") && view === "design" && <DesignWorkspaceView state={state} persist={persist} />}
          
          {allowedNav.some(n=>n.id==="dashboard") && view === "dashboard" && <DashboardView state={state} persist={persist} />}
          {allowedNav.some(n=>n.id==="drawingRegister") && view === "drawingRegister" && <ReceivedSentView state={state} persist={persist}/>}
          {allowedNav.some(n=>n.id==="classify") && view === "classify" && <ClassifyView state={state} persist={persist} />}
          {allowedNav.some(n=>n.id==="drive") && view === "drive" && <ProjectDriveView state={state} persist={persist}/>}
          {view === "technicalTable" && <TechnicalTableView state={state}/> }
          {view === "performance" && <PerformanceView state={state}/>}
          {view === "timesheet" && <><TimesheetView state={state} persist={persist} /><section style={{marginTop:20}}><button style={smallBtn} onClick={()=>setShowWihMeetings(v=>!v)}>{showWihMeetings?"Hide meetings":"Upcoming & past meetings"}</button>{showWihMeetings&&<MeetingsView state={state} persist={persist}/>}</section></>}
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
    <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginBottom:18}}><div><h2 style={{fontFamily:FONT_DISPLAY,margin:0}}>Projects</h2><div style={{fontSize:12,color:T.inkDim,marginTop:6}}>View only · Project information, contacts and planned work</div></div><ProjectStatusSelect projects={projects} aria-label="View project" style={{...inputStyle,minWidth:260}} value={p.id} onChange={e=>setSelected(e.target.value)}>{projects.map(x=><option key={x.id} value={x.id}>{x.no} · {x.name}</option>)}</ProjectStatusSelect></div>
    <div style={{display:'flex',gap:8,marginBottom:16}}>{[['scope','Projects & Scope'],['team','Teams & Ratings']].map(([id,label])=><Btn key={id} variant={tab===id?'dark':'ghost'} onClick={()=>setTab(id)}>{label}</Btn>)}</div>
    {tab==='scope'&&<><table style={{borderCollapse:'collapse',width:'100%'}}><tbody>{[['Project',p.name],['Number',p.no],['Client',p.client||p.contacts?.Owner?.name],['Architect',p.architect||p.contacts?.Architect?.name],['Address',p.address],['Type',p.type],['Status',p.status],['Start',formatProjectDate(p.startDate)],['End',p.endDate]].map(([label,value])=><tr key={label}><td style={{...tdStyle,textAlign:'left',width:170,color:T.inkDim}}>{label}</td><td style={{...tdStyle,textAlign:'left'}}>{String(value??'—')}</td></tr>)}</tbody></table><div style={{marginTop:18,fontFamily:FONT_BODY,fontSize:13}}><strong>Project scope</strong><div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:10}}>{Object.entries(p.scope||{}).filter(([,v])=>v===true).map(([k])=><span key={k} style={{background:T.paperDim,padding:'7px 10px'}}>{k.replace(/_/g,' ')}</span>)}</div></div></>}
    {tab==='team'&&<>{ROLE_CATEGORIES.map(({category,roles})=>{const entries=roles.filter(r=>p.contacts?.[r]);return entries.length?<div key={category} style={{marginBottom:20}}><div style={{fontFamily:FONT_MONO,color:categoryColor(category),marginBottom:8}}>{contactRoleLabel(category)}</div><table style={{width:'100%',borderCollapse:'collapse'}}><tbody>{entries.map(r=><tr key={r}>{[contactRoleLabel(r),p.contacts[r].name,p.contacts[r].company,p.contacts[r].email,p.contacts[r].mobile].map((v,i)=><td key={i} style={{...tdStyle,textAlign:'left'}}>{String(v??'—')||'—'}</td>)}</tr>)}</tbody></table></div>:null;})}</>}
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
  return <div><h2>Projects</h2><ProjectStatusSelect projects={state.projects} aria-label="Assigned project" style={inputStyle} value={p.id} onChange={e=>{setSelected(e.target.value);setTab('scope');}}>{state.projects.map(x=><option key={x.id} value={x.id}>{x.no} · {x.name}</option>)}</ProjectStatusSelect><p>Project role: <b>{contactRoleLabel(role)}</b> · {admin?'Manage this project':'View only'}</p><div style={{display:'flex',gap:8,marginBottom:18}}>{[['scope','Projects & Scope'],['delegation','Delegation'],['floor','Floor & Zone'],['site','Site Punch-in']].map(([id,label])=><Btn key={id} onClick={()=>setTab(id)} variant={tab===id?'dark':'ghost'}>{label}</Btn>)}</div>
  {tab==='delegation'&&<WorkflowDelegationView key={p.id} state={state} initialProjectId={p.id}/>}{tab==='scope'&&(admin?<ProjectScopeAdmin key={p.id} project={p} onSaved={async row=>saveScoped({...scoped,projects:[backendProjectToFrontend(row,p)]})}/>:<MemberProjectsView key={p.id} state={scoped}/>)}
  {tab==='floor'&&((state.currentUser.appAccess.toLowerCase()!=='viewer')?<DashboardView key={p.id} state={scoped} persist={saveScoped}/>:<table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Zone','Floor','Area'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead><tbody>{(p.floorZones||[]).map((r,i)=><tr key={r.floorZoneId||i}>{[r.zoneCode,r.floor,r.area].map((v,j)=><td key={j} style={tdStyle}>{v}</td>)}</tr>)}</tbody></table>)}
  {tab==='site'&&<ProjectPunchInsView key={p.id} state={scoped}/>}
  </div>;
}
function ReadOnlyProjectWork({project,state}){
  const [work,setWork]=useState([]),[drawings,setDrawings]=useState(null);
  useEffect(()=>{let live=true;setWork([]);setDrawings(null);projectApi.getWIH(true,project.id).then(rows=>{if(live)setWork(rows||[]);}).catch(()=>{});projectApi.listDrawingRegister(project.id).then(data=>{if(live)setDrawings((data?.drawings||[]).filter(d=>String(d.projectId)===String(project.id)));}).catch(()=>{if(live)setDrawings(undefined);});return()=>{live=false;};},[project.id]);
  const saved=project.lineOfWorkResidence||project.lineOfWork||[];
  const rows=saved.some(r=>['1','2'].includes(String(r.workflowVersion)))?saved:DESIGN_TASK_FLOW_TEMPLATE;
  return <><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Task','Starting Milestone','Subtask','Responsible','Hours'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.lineWorkId||r.id||i}>{[r.tasks||r.title,r.startingMilestone||r.milestone,r.subtask,r.responsible||r.assignee,r.hours].map((v,j)=><td key={j} style={tdStyle}>{j===0?<span style={{display:'inline-flex',alignItems:'center',gap:8}}>{v||'—'}</span>:j===3?<span style={{display:'inline-flex',alignItems:'center',gap:8}}><WorkflowStatusDot {...workflowDotStatus(workflowActivationStatus(work,r,r),workflowPrerequisite(r,drawings,project.floorZones||[],null,work))}/>{v||'Unassigned'}</span>:v||'—'}</td>)}</tr>)}</tbody></table><ProjectGantt state={state} projectId={project.id}/><WorkflowStatusLegend/></>;
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
  return <section><h2>Site Punch-in Records</h2><ProjectStatusSelect projects={orderedProjects(state.projects)} aria-label="Punch-in project" value={projectId} style={inputStyle} onChange={e=>setProjectId(e.target.value)}>{orderedProjects(state.projects).map(p=><option key={p.id} value={p.id}>{p.no} · {p.name}</option>)}</ProjectStatusSelect><p>{admin?'Project Admin · manage records and dates':canPunch?'Add or update your own records · only Admin can delete':'View only'}</p>{canPunch&&<Btn disabled={!projectId||busy} onClick={()=>setDraft({userId:state.currentUser.userId,purpose:'',checkInAt:'',checkOutAt:''})}>Add Punch-in Record</Btn>}
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
  const [rows,setRows]=useState([]),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[editor,setEditor]=useState(null),[rangeStart,setRangeStart]=useState(new Date().toISOString().slice(0,10)),[days,setDays]=useState(90);
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
function clearStudioCaches(){clearWorkflowWorkspaceCache();try{for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&/enlighten/i.test(k))localStorage.removeItem(k);}}catch(_){}}
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
