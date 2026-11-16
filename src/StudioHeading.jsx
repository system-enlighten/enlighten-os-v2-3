import React from 'react';

export function StudioHeadingText({title}){
 const date=new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'full'}).format(new Date());
 return <div className="studio-heading-text">
  <p className="studio-home-kicker">enLIGHTen / Studio desk</p>
  <h1 className="studio-page-heading">{title}</h1>
  <p>{date}</p>
 </div>;
}

export default function StudioHeading({title,children}){
 return <header className="studio-desk-heading"><StudioHeadingText title={title}/>{children}</header>;
}
