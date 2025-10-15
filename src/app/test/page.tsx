'use client';

//import { useState, useEffect } from 'react';
//import Image from 'next/image';

   function Header (){

    return(
        <div className="bg-blue-500 text-white p-4">
             This is Header
        </div>
    )
   }

   function Tamer (){
    return(
        <div className="bg-red-300 text-white p-4">
            tamer is text

        </div>
    )
   }

   function Samer (){
    return(
    <div className="bg-amber-400 text-white p-1 text-2xl ">
        samer is text
    </div>
    )
   }

 //نتنيسبتمنتسيبمنيتبيمسنبتيسمنتبيسبتسي
 export  default function Home(){
      return(
        <main>
            <p>hello word</p>
            <Header />
            <Tamer />
            <Samer/>
        </main>
        
       
         );
    }




