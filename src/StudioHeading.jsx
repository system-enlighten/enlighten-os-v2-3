import React from 'react';

export function StudioHeadingText({title,department="Studio"}){
 const date=new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'full'}).format(new Date());
 return <div className="studio-heading-text">
  <p className="studio-home-kicker">enLIGHTen / {department} desk</p>
  <h1 className="studio-page-heading">{title}</h1>
  <p>{date}</p>
 </div>;
}

export default function StudioHeading({title,department,children}){
 return <header className="studio-desk-heading"><StudioHeadingText title={title} department={department}/>{children}</header>;
}
