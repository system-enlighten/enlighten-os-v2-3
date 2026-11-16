export function projectCardFloor(value){
 const floor=String(value||'').trim().toUpperCase();
 if(/^(SF|STILT(?: FLOOR)?)$/.test(floor))return 'SF';
 if(/^(GF|GROUND(?: FLOOR)?)$/.test(floor))return 'GF';
 const basement=floor.match(/^(?:B(?:ASEMENT)?\s*[- ]?\s*(\d*)|-(\d+)F)$/);
 if(basement)return '-'+Number(basement[1]||basement[2]||1)+'F';
 const level=floor.match(/^(?:FLOOR\s*)?(\d+)(?:F|(?:ST|ND|RD|TH)?(?:\s+FLOOR)?)$/);
 if(level)return Number(level[1])+'F';
 return ({'FIRST FLOOR':'1F','SECOND FLOOR':'2F','THIRD FLOOR':'3F','FOURTH FLOOR':'4F'})[floor]||floor;
}

