(function(){
  const files={daily:'oracoes-diarias.json',regra:'regra.json',rosario:'rosario.json',devotions:{vigilia:'vigilia.json',coroa:'coroa.json',stabat:'stabat-mater.json',via_matris:'via-matris.json',ladainhas:'ladainhas.json',sabado:'sabado-mariano.json',adoracao:'adoracao.json',antifonas:'antifonas.json',variasHome:'oracoes-varias.json'}};
  async function load(){
    const read=async name=>{const response=await fetch('./data/devocoes/'+name,{cache:'no-store'});if(!response.ok)throw new Error('Não foi possível carregar '+name);return response.json();};
    const jobs=[read(files.daily),read(files.regra),read(files.rosario),...Object.values(files.devotions).map(read)];
    const [daily,regra,rosario,...devotionValues]=await Promise.all(jobs);
    const devotions=Object.fromEntries(Object.keys(files.devotions).map((key,index)=>[key,devotionValues[index]]));
    window.OSM_PRAYERS={daily,regra,devotions};window.OSM_ROSARIO_MISTERIOS=rosario;
  }
  window.loadOSMDevotionalData=load;
})();
