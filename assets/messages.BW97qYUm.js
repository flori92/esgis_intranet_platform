import{U as n}from"./index.DiDytfxl.js";const c=async(a,{roleFilter:r}={})=>{try{let e=n.from("profiles").select("id, full_name, email, avatar_url, role, is_active").neq("id",a).eq("is_active",!0).order("full_name",{ascending:!0});r!=null&&r.length&&(e=e.in("role",r));const{data:t,error:s}=await e;return s?{contacts:[],error:s}:{contacts:t||[],error:null}}catch(e){return console.error("getContacts:",e),{contacts:[],error:e}}},i=async(a,r="received")=>{try{let e=n.from("messages").select(`
        id,
        sender_id,
        recipient_id,
        subject,
        content:body,
        read:is_read,
        created_at,
        sender:profiles!sender_id(id, full_name, email, avatar_url, role),
        recipient:profiles!recipient_id(id, full_name, email, avatar_url, role)
      `).order("created_at",{ascending:!1});e=r==="received"?e.eq("recipient_id",a):e.eq("sender_id",a);const{data:t,error:s}=await e;return s?{messages:[],error:s}:{messages:t||[],error:null}}catch(e){return console.error("getMessages:",e),{messages:[],error:e}}},d=async a=>{try{const{error:r}=await n.from("messages").update({is_read:!0}).eq("id",a);return{error:r||null}}catch(r){return console.error("markMessageAsRead:",r),{error:r}}},l=async({sender_id:a,recipient_id:r,subject:e,content:t})=>{try{const{error:s}=await n.from("messages").insert({sender_id:a,recipient_id:r,subject:e,body:t,is_read:!1});return{error:s||null}}catch(s){return console.error("sendMessage:",s),{error:s}}};export{i as a,c as g,d as m,l as s};
