/* Optional Android reminders. No permission request during startup. */
(function(root){
  const KEY='osmDailyReminder', CHANNEL='servita-celebrations', BASE=700000;
  function buildNotifications(saints,time,now=new Date()){
    if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error('Horário inválido');
    const [hour,minute]=time.split(':').map(Number), notifications=[];
    for(let offset=0;offset<60;offset++){
      const at=new Date(now.getFullYear(),now.getMonth(),now.getDate()+offset,hour,minute);
      if(at<=now)continue;
      for(const s of saints.filter(s=>s.month===at.getMonth()+1&&s.day===at.getDate())){
        let name=s.title.trim();
        const label=s.categoria==='beato'?(s.genero==='f'?'Beata':'Beato'):s.categoria==='servo_de_deus'?(s.genero==='f'?'Serva de Deus':'Servo de Deus'):s.categoria==='santo'?(s.genero==='f'?'Santa':'Santo'):'';
        if(s.exibir_selo!==false&&label&&!/^(São|Santo|Santa|Santos|Santas|Beato|Beata|Servo de Deus|Serva de Deus)\b/i.test(name))name=label+' '+name.replace(/^B(?:\.A)?\.\s*/i,'');
        const grade={solenidade:'Solenidade',festa:'Festa',memoria:'Memória',memoria_facultativa:'Memória facultativa',comemoracao:'Comemoração'}[s.grau]||'';
        notifications.push({id:BASE+s.id,title:'Hoje na Família Servita',body:name+(grade?' · '+grade:''),channelId:CHANNEL,schedule:{at,allowWhileIdle:false},isExactNotification:false,extra:{celebrationId:s.id,source:KEY}});
      }
    }
    return notifications;
  }
  if(typeof module!=='undefined')module.exports={buildNotifications};
  if(!root.document)return;
  let plugin,saints=[],open,ready=false,pendingId=null,busy=false,queue=Promise.resolve();
  let preferences={enabled:false,time:'07:00'};
  try{const stored=JSON.parse(localStorage.getItem(KEY));if(stored&&/^([01]\d|2[0-3]):[0-5]\d$/.test(stored.time))preferences={enabled:stored.enabled===true,time:stored.time};}catch(_){}
  function status(message){const el=document.getElementById('reminderStatus');if(el)el.textContent=message;}
  function refresh(){
    const toggle=document.getElementById('reminderEnabled'),time=document.getElementById('reminderTime');
    if(toggle){toggle.checked=preferences.enabled;toggle.disabled=busy||!ready;}
    if(time){time.value=preferences.time;time.disabled=busy||!ready;}
  }
  function save(){localStorage.setItem(KEY,JSON.stringify(preferences));}
  async function cancel(){const pending=await plugin.getPending();const own=pending.notifications.filter(n=>n.extra?.source===KEY||(n.id>=BASE&&n.id<BASE+10000));if(own.length)await plugin.cancel({notifications:own.map(n=>({id:n.id}))});}
  function sync(){
    queue=queue.catch(()=>{}).then(async()=>{
      if(!plugin||!ready)return;
      await cancel();
      if(!preferences.enabled){status('Desligado. Nenhum aviso será enviado.');return;}
      if((await plugin.checkPermissions()).display!=='granted'){
        preferences.enabled=false;save();refresh();status('Notificações não autorizadas. Ative o lembrete para tentar novamente.');return;
      }
      await plugin.createChannel({id:CHANNEL,name:'Celebrações servitas',importance:3,visibility:1});
      const notifications=buildNotifications(saints,preferences.time);
      if(notifications.length)await plugin.schedule({notifications});
      status('Ativo nos dias com celebração própria. O horário pode variar conforme o Android. Abra o app ao menos a cada 60 dias para renovar os avisos.');
    });
    return queue;
  }
  async function change(enabled,time){
    if(busy||!ready)return;
    busy=true;refresh();
    try{
      if(enabled&&!preferences.enabled){
        if(!root.confirm('Permitir que o Liturgia OSM avise sobre as celebrações servitas no horário escolhido? Não haverá avisos em dias sem celebração própria.'))return;
        if((await plugin.requestPermissions()).display!=='granted'){status('Permissão não concedida. O lembrete continua desligado.');return;}
      }
      preferences={enabled,time};save();await sync();
    }catch(error){console.warn('[Lembrete OSM]',error);status('Não foi possível atualizar os avisos. Abra o app novamente para tentar.');}
    finally{busy=false;refresh();}
  }
  const api=root.OSMReminders={
    init(){
      if(root.Capacitor?.getPlatform?.()!=='android')return;
      plugin=getCapacitorPlugin('LocalNotifications');if(!plugin)return;
      const section=document.getElementById('reminderSettings');section.hidden=false;
      document.getElementById('reminderEnabled').addEventListener('change',e=>change(e.target.checked,preferences.time));
      document.getElementById('reminderTime').addEventListener('change',e=>{if(e.target.validity.valid&&e.target.value)change(preferences.enabled,e.target.value);});
      plugin.addListener('localNotificationActionPerformed',action=>{
        const id=action.notification?.extra?.celebrationId;
        if(action.notification?.extra?.source!==KEY||!Number.isInteger(id))return;
        pendingId=id;api.openPending();
      }).catch(error=>console.warn('[Lembrete OSM]',error));
      getCapacitorPlugin('App')?.addListener('appStateChange',({isActive})=>{if(isActive)sync().catch(()=>status('Não foi possível renovar os avisos. Abra o app novamente.'));});
      refresh();
    },
    setData(data,opener){saints=data;open=opener;ready=true;refresh();api.openPending();sync().catch(()=>status('Não foi possível renovar os avisos. Abra o app novamente.'));},
    openPending(){if(ready&&pendingId!==null){const id=pendingId;pendingId=null;if(saints.some(s=>s.id===id))open(id);}}
  };
})(typeof window==='undefined'?globalThis:window);
