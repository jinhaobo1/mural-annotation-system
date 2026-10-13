// Owner: 李鹏祥（B乙·前端）

const APP = {
  roles:{
    admin:{
      name:'管理员', user:'admin_01',
      pages:['dashboard','samples','sample-detail','import','ai-jobs','ai-batch','ai-run','review','expert','taxonomy','ai-config','qc','roles','versions','export','json-preview','task-assignment','workflow','my-tasks'],
      nav:[
        ['项目管理',[['dashboard','index.html','项目概览'],['samples','samples.html','壁画数据'],['task-assignment','task-assignment.html','任务分配'],['ai-jobs','ai-jobs.html','AI任务中心'],['workflow','workflow.html','标注工作流']]],
        ['配置中心',[['taxonomy','taxonomy.html','标注体系'],['ai-config','ai-config.html','AI配置'],['qc','qc.html','质检规则'],['roles','roles.html','用户与角色']]],
        ['数据治理',[['versions','versions.html','版本与审计'],['export','export.html','数据导出']]]
      ]
    },
    reviewer:{
      name:'标注审核员', user:'reviewer_01',
      pages:['dashboard','my-tasks','sample-detail','review','json-preview','versions'],
      nav:[
        ['我的工作',[['dashboard','index.html','工作台首页'],['my-tasks','my-tasks.html','我的任务']]],
        ['记录',[['versions','versions.html','我的审核记录']]]
      ]
    },
    expert:{
      name:'专家审核员', user:'expert_01',
      pages:['dashboard','expert','sample-detail','review','json-preview','versions','taxonomy'],
      nav:[
        ['专家工作',[['dashboard','index.html','工作台首页'],['expert','expert.html','专家任务']]],
        ['参考与记录',[['taxonomy','taxonomy.html','标注体系'],['versions','versions.html','复核记录']]]
      ]
    },
    researcher:{
      name:'只读研究员', user:'researcher_01',
      pages:['dashboard','samples','sample-detail','versions','export','json-preview'],
      nav:[
        ['数据浏览',[['dashboard','index.html','数据概览'],['samples','samples.html','已批准壁画'],['versions','versions.html','版本记录'],['export','export.html','数据导出']]]
      ]
    }
  }
};
function getRole(){return localStorage.getItem('mural_role')||'admin'}
function setRole(r){localStorage.setItem('mural_role',r);location.reload()}
function toast(msg){
  let t=document.getElementById('toast');
  if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t)}
  t.setAttribute('role','status');t.setAttribute('aria-live','polite');t.textContent=msg;t.classList.add('show');clearTimeout(t._hideTimer);t._hideTimer=setTimeout(()=>t.classList.remove('show'),2400)
}
function shell(){
  const page=document.body.dataset.page||'dashboard', role=getRole(), cfg=APP.roles[role]||APP.roles.admin;
  const allowed=cfg.pages.includes(page);
  const navHtml=(cfg.nav||[]).map(([g,items])=>`<div class="nav-group">${g}</div>`+items.map(([id,href,label])=>
    `<a href="${href}" class="${id===page?'active':''}"><span class="nav-dot"></span>${label}</a>`
  ).join('')).join('');
  const roleOpts=Object.entries(APP.roles).map(([k,v])=>`<option value="${k}" ${role===k?'selected':''}>${v.name}</option>`).join('');
  const original=[...document.body.children];
  const shell=document.createElement('div');shell.className='shell';
  shell.innerHTML=`<aside class="sidebar" id="site-sidebar"><div class="brand"><div class="brand-title">壁画结构化语义标注系统</div><div class="brand-sub">AI标注 → 审核 → 专家复核 → 管理员验收</div></div><nav class="nav" aria-label="主导航">${navHtml}</nav><div class="sidebar-foot">交互原型 V8.0 · 角色工作区</div></aside><section class="main-shell"><header class="topbar"><div class="topbar-left"><button class="mobile-menu" type="button" aria-label="打开导航菜单" aria-controls="site-sidebar" aria-expanded="false">☰</button><div class="project-name">壁画结构化语义标注项目</div><span class="badge blue">taxonomy v1.2-custom</span></div><div class="topbar-right"><div class="inline-user"><div class="user">${cfg.name.slice(0,1)}</div><div><div class="user-name">${cfg.user}</div><div style="font-size:10px;color:#98a2b3">${cfg.name}</div></div></div><select class="select" title="原型中切换角色查看不同工作区" onchange="setRole(this.value)">${roleOpts}</select></div></header><main class="content" id="content-slot"></main></section><div class="nav-backdrop" aria-hidden="true"></div>`;
  document.body.appendChild(shell);
  const slot=shell.querySelector('#content-slot');
  original.forEach(n=>{if(n.tagName!=='SCRIPT')slot.appendChild(n)});
  const menu=shell.querySelector('.mobile-menu'), sidebar=shell.querySelector('.sidebar'), backdrop=shell.querySelector('.nav-backdrop');
  const closeNav=()=>{sidebar.classList.remove('mobile-open');backdrop.classList.remove('show');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','打开导航菜单')};
  menu.addEventListener('click',()=>{const open=!sidebar.classList.contains('mobile-open');sidebar.classList.toggle('mobile-open',open);backdrop.classList.toggle('show',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'关闭导航菜单':'打开导航菜单')});
  backdrop.addEventListener('click',closeNav);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sidebar.classList.contains('mobile-open')){closeNav();menu.focus()}});
  if(!allowed){
    slot.innerHTML=`<div class="card denied"><h2>无访问权限</h2><p>当前角色「${cfg.name}」没有访问此功能区的权限。</p><a class="btn primary" href="index.html">返回当前角色首页</a></div>`;
  }
}
document.addEventListener('DOMContentLoaded',()=>{
  shell();
  document.querySelectorAll('.switch').forEach(s=>{s.setAttribute('role','switch');s.setAttribute('tabindex','0');s.setAttribute('aria-checked',String(s.classList.contains('on')));const toggle=()=>{s.classList.toggle('on');s.setAttribute('aria-checked',String(s.classList.contains('on')))};s.addEventListener('click',toggle);s.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();toggle()}})});
  document.querySelectorAll('[data-tab]').forEach(t=>{t.setAttribute('role','tab');t.setAttribute('tabindex','0');t.setAttribute('aria-selected',String(t.classList.contains('active')));t.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();t.click()}});t.addEventListener('click',()=>{
    const group=t.dataset.group;document.querySelectorAll(`[data-tab][data-group="${group}"]`).forEach(x=>{x.classList.remove('active');x.setAttribute('aria-selected','false')});t.classList.add('active');t.setAttribute('aria-selected','true');
    document.querySelectorAll(`[data-panel][data-group="${group}"]`).forEach(x=>x.classList.toggle('active',x.dataset.panel===t.dataset.tab));
  })});
});
function openModal(id){document.getElementById(id).classList.add('show')}
function closeModal(id){document.getElementById(id).classList.remove('show')}
function confirmAction(msg,redirect){toast(msg); if(redirect)setTimeout(()=>location.href=redirect,600)}
function downloadText(filename,text){
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download=filename;a.click();URL.revokeObjectURL(a.href)
}

function getSampleMeta(){
  const saved=JSON.parse(localStorage.getItem('sample_meta')||'null');
  if(saved){delete saved.address;return saved}
  return {
    mural_id:'MURAL-02315',
    name:'人物图',
    image:'assets/sample_mural.png',
    caption:'绘一男一女。左侧男子头戴尖山小冠，身穿淡土红色交社衫，拱手，似施礼。右侧女子头梳倭堕髻，身穿淡土红色交社百戏衫，系淡土红色曳地长裙。腹部隆起，左手置腹前，右手指点。'
  }
}
function setSampleMeta(meta){localStorage.setItem('sample_meta',JSON.stringify(meta))}
function getReviewDraft(){
  const raw=localStorage.getItem('review_draft_v3'); if(raw) return JSON.parse(raw);
  return {
    sample:{...getSampleMeta(),view_type:'full_scene',source_group_id:'SCENE-02315'},
    scene:{themes:['人物生活']},
    regions:[],
    entities:[
      {id:'E1',base_category:'HUMAN',level1_category:'HUMAN',level2_category:'HUMAN_ORDINARY',level3_category:'GENERIC_PERSON',sub_category:'普通人物',fine_category:{value:'普通人物（未细分）',taxonomy_id:'GENERIC_PERSON',certainty:'certain',evidence:['caption_explicit'],ai_confidence:0.93},bbox:[160,390,500,700],attributes:[{name:'gender',value:'男',certainty:'certain',evidence:'caption_explicit',ai_confidence:0.98},{name:'headwear',value:'尖山小冠',certainty:'certain',evidence:'caption_explicit',ai_confidence:0.96}],states:[],actions:[{name:'gesture',value:'拱手',certainty:'certain',evidence:'caption_explicit',ai_confidence:0.91},{name:'action',value:'施礼',certainty:'probable',evidence:'caption_explicit',ai_confidence:0.68}],visibility:'clear',source_type:'caption_grounded'},
      {id:'E2',base_category:'HUMAN',level1_category:'HUMAN',level2_category:'HUMAN_ORDINARY',level3_category:'GENERIC_PERSON',sub_category:'普通人物',fine_category:{value:'普通人物（未细分）',taxonomy_id:'GENERIC_PERSON',certainty:'certain',evidence:['caption_explicit'],ai_confidence:0.91},bbox:[480,410,820,710],attributes:[{name:'gender',value:'女',certainty:'certain',evidence:'caption_explicit',ai_confidence:0.98},{name:'hairstyle',value:'倭堕髻',certainty:'certain',evidence:'caption_explicit',ai_confidence:0.88},{name:'lower_garment',value:'淡土红色曳地长裙',certainty:'certain',evidence:'caption_explicit',ai_confidence:0.90},{name:'body_feature',value:'腹部隆起',certainty:'certain',evidence:'caption_explicit',ai_confidence:0.82}],states:[],actions:[{name:'action',value:'指点',certainty:'certain',evidence:'caption_explicit',ai_confidence:0.84}],visibility:'clear',source_type:'caption_grounded'}
    ],
    groups:[],events:[],
    relations:[{subject:'E1',predicate:'left_of',object:'E2',certainty:'certain',ai_confidence:0.96}],
    qc_issues:[]
  }
}
function saveReviewDraft(d){localStorage.setItem('review_draft_v3',JSON.stringify(d))}

/* ===== V4: 统一标注体系定义 ===== */
function defaultAnnotationTaxonomy(){
  return {
    version:"v1.2-custom",
    terms:[
      /* ===== 一级实体类别（教程 2.3.1 固定 11 类）===== */
      {id:"HUMAN",name:"人物",parent:null,level:1},
      {id:"ANIMAL",name:"真实动物",parent:null,level:1},
      {id:"SUPERNATURAL",name:"神异形象",parent:null,level:1},
      {id:"OBJECT",name:"器物",parent:null,level:1},
      {id:"FURNITURE",name:"家具陈设",parent:null,level:1},
      {id:"VEHICLE",name:"交通工具",parent:null,level:1},
      {id:"ARCHITECTURE",name:"建筑设施",parent:null,level:1},
      {id:"PLANT_NATURE",name:"植物与自然物",parent:null,level:1},
      {id:"CELESTIAL",name:"天象",parent:null,level:1},
      {id:"ORNAMENT",name:"装饰纹样",parent:null,level:1},
      {id:"INSCRIPTION",name:"文字题记",parent:null,level:1},

      /* ===== HUMAN 二级（教程 2.3.2 九类）与三级（教程 2.3.3）===== */
      {id:"HUMAN_OWNER",name:"主人类",parent:"HUMAN",level:2},
      {id:"TOMB_OWNER",name:"墓主人",parent:"HUMAN_OWNER",level:3},
      {id:"LADY",name:"夫人",parent:"HUMAN_OWNER",level:3},

      {id:"HUMAN_ATTENDANT",name:"侍从类",parent:"HUMAN",level:2},
      {id:"FEMALE_ATTENDANT",name:"侍女",parent:"HUMAN_ATTENDANT",level:3},
      {id:"MALE_ATTENDANT",name:"男侍",parent:"HUMAN_ATTENDANT",level:3},
      {id:"ATTENDANT_GENERIC",name:"侍者",parent:"HUMAN_ATTENDANT",level:3},
      {id:"SERVANT",name:"仆人",parent:"HUMAN_ATTENDANT",level:3},
      {id:"SLAVE",name:"奴婢",parent:"HUMAN_ATTENDANT",level:3},
      {id:"PAGE_BOY",name:"僮仆",parent:"HUMAN_ATTENDANT",level:3},

      {id:"HUMAN_OFFICIAL",name:"官吏类",parent:"HUMAN",level:2},
      {id:"CIVIL_OFFICIAL",name:"文吏",parent:"HUMAN_OFFICIAL",level:3},
      {id:"DOOR_OFFICIAL",name:"门吏",parent:"HUMAN_OFFICIAL",level:3},

      {id:"HUMAN_MILITARY",name:"武职类",parent:"HUMAN",level:2},
      {id:"MILITARY_OFFICIAL",name:"武职人物",parent:"HUMAN_MILITARY",level:3},

      {id:"HUMAN_PERFORMER",name:"乐舞表演类",parent:"HUMAN",level:2},
      {id:"MUSICIAN",name:"乐伎/乐师",parent:"HUMAN_PERFORMER",level:3},
      {id:"DANCER",name:"舞者",parent:"HUMAN_PERFORMER",level:3},

      {id:"HUMAN_LABOR",name:"劳作类",parent:"HUMAN",level:2},
      {id:"HUMAN_RELIGIOUS",name:"宗教人物类",parent:"HUMAN",level:2},
      {id:"HUMAN_HISTORICAL",name:"历史人物类",parent:"HUMAN",level:2},

      {id:"HUMAN_ORDINARY",name:"普通人物",parent:"HUMAN",level:2},
      {id:"GENERIC_PERSON",name:"普通人物（未细分）",parent:"HUMAN_ORDINARY",level:3},

      /* ===== ANIMAL ===== */
      {id:"ANIMAL_DOMESTIC",name:"家畜",parent:"ANIMAL",level:2},
      {id:"HORSE",name:"马",parent:"ANIMAL_DOMESTIC",level:3},
      {id:"CATTLE",name:"牛",parent:"ANIMAL_DOMESTIC",level:3},
      {id:"SHEEP",name:"羊",parent:"ANIMAL_DOMESTIC",level:3},

      /* ===== SUPERNATURAL（教程 2.3.3 完整树）===== */
      {id:"FOUR_SYMBOLS",name:"四神类",parent:"SUPERNATURAL",level:2},
      {id:"AZURE_DRAGON",name:"青龙",parent:"FOUR_SYMBOLS",level:3},
      {id:"WHITE_TIGER",name:"白虎",parent:"FOUR_SYMBOLS",level:3},
      {id:"VERMILION_BIRD",name:"朱雀",parent:"FOUR_SYMBOLS",level:3},
      {id:"BLACK_TORTOISE",name:"玄武",parent:"FOUR_SYMBOLS",level:3},
      {id:"DIVINE_BEAST",name:"神兽类",parent:"SUPERNATURAL",level:2},
      {id:"FEATHERED_PERSON",name:"羽人",parent:"SUPERNATURAL",level:2},
      {id:"FUXI",name:"伏羲",parent:"SUPERNATURAL",level:2},
      {id:"NUWA",name:"女娲",parent:"SUPERNATURAL",level:2},
      {id:"XIWANGMU",name:"西王母",parent:"SUPERNATURAL",level:2},
      {id:"DONGWANGGONG",name:"东王公",parent:"SUPERNATURAL",level:2},

      /* ===== OBJECT（教程 2.3.2 按功能十类；乐器三级见 2.3.3）===== */
      {id:"OBJECT_DINING",name:"饮食器",parent:"OBJECT",level:2},
      {id:"PLATE",name:"盘",parent:"OBJECT_DINING",level:3},
      {id:"EAR_CUP",name:"耳杯",parent:"OBJECT_DINING",level:3},
      {id:"JUG",name:"壶",parent:"OBJECT_DINING",level:3},
      {id:"OBJECT_MUSIC",name:"乐器",parent:"OBJECT",level:2},
      {id:"PIPA",name:"琵琶",parent:"OBJECT_MUSIC",level:3},
      {id:"FLUTE",name:"横笛",parent:"OBJECT_MUSIC",level:3},
      {id:"WAIST_DRUM",name:"腰鼓",parent:"OBJECT_MUSIC",level:3},
      {id:"BIG_DRUM",name:"大鼓",parent:"OBJECT_MUSIC",level:3},
      {id:"KONGHOU",name:"箜篌",parent:"OBJECT_MUSIC",level:3},
      {id:"RUANXIAN",name:"阮咸",parent:"OBJECT_MUSIC",level:3},
      {id:"PAIBAN",name:"拍板",parent:"OBJECT_MUSIC",level:3},
      {id:"OBJECT_WEAPON",name:"武器",parent:"OBJECT",level:2},
      {id:"OBJECT_CEREMONIAL",name:"仪仗器",parent:"OBJECT",level:2},
      {id:"OBJECT_FARM",name:"农具",parent:"OBJECT",level:2},
      {id:"OBJECT_KITCHEN",name:"厨具",parent:"OBJECT",level:2},
      {id:"OBJECT_STATIONERY",name:"文房用品",parent:"OBJECT",level:2},
      {id:"OBJECT_DAILY",name:"生活用品",parent:"OBJECT",level:2},
      {id:"OBJECT_FOOD",name:"食物",parent:"OBJECT",level:2},
      {id:"OBJECT_OTHER",name:"其他器物",parent:"OBJECT",level:2},

      /* ===== FURNITURE / VEHICLE / ARCHITECTURE / PLANT_NATURE ===== */
      {id:"SEATING",name:"坐具",parent:"FURNITURE",level:2},
      {id:"CHAIR",name:"椅",parent:"SEATING",level:3},
      {id:"COUCH",name:"榻",parent:"SEATING",level:3},
      {id:"CART",name:"车舆",parent:"VEHICLE",level:2},
      {id:"HORSE_CART",name:"马车",parent:"CART",level:3},
      {id:"ARCH_STRUCTURE",name:"建筑物",parent:"ARCHITECTURE",level:2},
      {id:"PAVILION",name:"亭阁",parent:"ARCH_STRUCTURE",level:3},
      {id:"PLANT",name:"植物",parent:"PLANT_NATURE",level:2},
      {id:"TREE",name:"树木",parent:"PLANT",level:3}
    ],
    fact_schemas:[
      {kind:"attributes",code:"gender",name:"性别",applies_to:["HUMAN"],values:["男","女","不详"]},
      {kind:"attributes",code:"age_group",name:"年龄阶段",applies_to:["HUMAN"],values:["儿童","青年","中年","老年","不详"]},
      {kind:"attributes",code:"hairstyle",name:"发式",applies_to:["HUMAN"],values:["双髻","高髻","束发","倭堕髻","披发","不详"]},
      {kind:"attributes",code:"headwear",name:"冠帽",applies_to:["HUMAN"],values:["尖山小冠","进贤冠","介帻","展脚幞头","软脚幞头","无冠帽","不详"]},
      {kind:"attributes",code:"upper_garment",name:"上装",applies_to:["HUMAN"],values:["交领衫","圆领窄袖袍","交领袍","百戏衫","不详"]},
      {kind:"attributes",code:"lower_garment",name:"下装",applies_to:["HUMAN"],values:["曳地长裙","长裙","裤","不详"]},
      {kind:"attributes",code:"body_feature",name:"身体特征",applies_to:["HUMAN"],values:["腹部隆起","胡须","丰腴","瘦削","不详"]},

      {kind:"states",code:"posture",name:"姿态",applies_to:["HUMAN"],values:["站立","端坐","盘腿而坐","跪坐","席地而坐","俯身","匍匐","不详"]},
      {kind:"states",code:"orientation",name:"朝向",applies_to:["HUMAN"],values:["正面","侧身","面向左","面向右","昂首","低头","不详"]},

      {kind:"actions",code:"gesture",name:"手势动作",applies_to:["HUMAN"],values:["拱手","作揖","指点","挥袖","双手置腹前","不详"]},
      {kind:"actions",code:"performance_action",name:"表演动作",applies_to:["HUMAN"],values:["起舞","细步曼舞","奏乐","击鼓","吹奏","不详"]},
      {kind:"actions",code:"social_action",name:"社交动作",applies_to:["HUMAN"],values:["施礼","观赏","交谈","侍立","不详"]},
      {kind:"actions",code:"locomotion",name:"移动动作",applies_to:["HUMAN"],values:["行走","奔跑","骑行","不详"]},

      {kind:"attributes",code:"animal_color",name:"动物颜色",applies_to:["ANIMAL"],values:["白","黑","黄","褐","杂色","不详"]},
      {kind:"states",code:"animal_posture",name:"动物姿态",applies_to:["ANIMAL"],values:["站立","行走","奔跑","卧","不详"]},
      {kind:"actions",code:"animal_action",name:"动物动作",applies_to:["ANIMAL"],values:["奔跑","饮水","进食","拉车","不详"]},

      {kind:"attributes",code:"object_material",name:"材质",applies_to:["OBJECT"],values:["陶","铜","木","漆","不详"]},
      {kind:"attributes",code:"object_color",name:"颜色",applies_to:["OBJECT"],values:["红","黑","白","黄","青","不详"]}
    ],
    scenes:["人物生活","宴饮饮食","乐舞娱乐","出行仪仗","生产劳动","狩猎","礼仪宗教","历史故事","神话祥瑞","天象生肖","花鸟山水","建筑陈设","装饰图案","其他"],
    events:["舞蹈","奏乐","宴饮","出行","农耕","狩猎","礼佛"],
    relations:[
      /* 2.5.1 空间关系 */
      {family:"SPATIAL",predicate:"left_of",sub:"ANY",obj:"ANY",active:true},
      {family:"SPATIAL",predicate:"right_of",sub:"ANY",obj:"ANY",active:true},
      {family:"SPATIAL",predicate:"above",sub:"ANY",obj:"ANY",active:true},
      {family:"SPATIAL",predicate:"below",sub:"ANY",obj:"ANY",active:true},
      {family:"SPATIAL",predicate:"in_front_of",sub:"ANY",obj:"ANY",active:true},
      {family:"SPATIAL",predicate:"behind",sub:"ANY",obj:"ANY",active:true},
      {family:"SPATIAL",predicate:"beside",sub:"ANY",obj:"ANY",active:true},
      {family:"SPATIAL",predicate:"between",sub:"ANY",obj:"ANY",active:true},
      {family:"SPATIAL",predicate:"inside",sub:"ANY",obj:"ANY",active:true},
      {family:"SPATIAL",predicate:"contains",sub:"ANY",obj:"ANY",active:true},
      {family:"SPATIAL",predicate:"on",sub:"ANY",obj:"ANY",active:true},
      {family:"SPATIAL",predicate:"under",sub:"ANY",obj:"ANY",active:true},
      {family:"SPATIAL",predicate:"around",sub:"ANY",obj:"ANY",active:true},
      {family:"SPATIAL",predicate:"opposite_to",sub:"ANY",obj:"ANY",active:true},
      {family:"SPATIAL",predicate:"facing",sub:"HUMAN",obj:"HUMAN",active:true},
      /* 2.5.2 成员与组成关系 */
      {family:"MEMBERSHIP",predicate:"member_of",sub:"ANY",obj:"GROUP",active:true},
      {family:"MEMBERSHIP",predicate:"subgroup_of",sub:"GROUP",obj:"GROUP",active:true},
      {family:"MEMBERSHIP",predicate:"part_of",sub:"ANY",obj:"ANY",active:true},
      {family:"MEMBERSHIP",predicate:"located_in",sub:"ANY",obj:"REGION",active:true},
      /* 2.5.3 实体交互关系 */
      {family:"INTERACTION",predicate:"hold",sub:"HUMAN",obj:"OBJECT",active:true},
      {family:"INTERACTION",predicate:"carry",sub:"HUMAN",obj:"OBJECT",active:true},
      {family:"INTERACTION",predicate:"ride",sub:"HUMAN",obj:"ANIMAL",active:true},
      {family:"INTERACTION",predicate:"lead",sub:"HUMAN",obj:"ANIMAL",active:true},
      {family:"INTERACTION",predicate:"pull",sub:"HUMAN",obj:"ANY",active:true},
      {family:"INTERACTION",predicate:"use",sub:"HUMAN",obj:"ANY",active:true},
      {family:"INTERACTION",predicate:"play",sub:"HUMAN",obj:"OBJECT",active:true},
      {family:"INTERACTION",predicate:"sit_on",sub:"HUMAN",obj:"FURNITURE",active:true},
      {family:"INTERACTION",predicate:"stand_on",sub:"HUMAN",obj:"FURNITURE",active:true},
      /* 2.5.4 叙事关系 */
      {family:"NARRATIVE",predicate:"serve",sub:"HUMAN",obj:"HUMAN",active:true},
      {family:"NARRATIVE",predicate:"attend",sub:"HUMAN",obj:"HUMAN",active:true},
      {family:"NARRATIVE",predicate:"guard",sub:"HUMAN",obj:"ANY",active:true},
      {family:"NARRATIVE",predicate:"follow",sub:"ANY",obj:"ANY",active:true},
      {family:"NARRATIVE",predicate:"observe",sub:"HUMAN",obj:"EVENT",active:true},
      {family:"NARRATIVE",predicate:"listen_to",sub:"HUMAN",obj:"EVENT",active:true},
      {family:"NARRATIVE",predicate:"worship",sub:"HUMAN",obj:"ANY",active:true},
      {family:"NARRATIVE",predicate:"guide",sub:"ANY",obj:"HUMAN",active:true},
      {family:"NARRATIVE",predicate:"chase",sub:"HUMAN",obj:"ANIMAL",active:true},
      {family:"NARRATIVE",predicate:"accompany",sub:"ANY",obj:"ANY",active:true},
      {family:"NARRATIVE",predicate:"observer_of",sub:"GROUP",obj:"EVENT",active:true},
      {family:"NARRATIVE",predicate:"performer_of",sub:"GROUP",obj:"EVENT",active:true},
      /* 2.5.5 文字关联关系 */
      {family:"TEXT",predicate:"identifies",sub:"INSCRIPTION",obj:"ANY",active:true},
      {family:"TEXT",predicate:"labels",sub:"INSCRIPTION",obj:"ANY",active:true},
      {family:"TEXT",predicate:"names",sub:"INSCRIPTION",obj:"ANY",active:true}
    ]
  }
}
function getAnnotationTaxonomy(){
  const raw=localStorage.getItem("custom_taxonomy_v4") || localStorage.getItem("custom_taxonomy");
  if(raw){
    try{
      const t=JSON.parse(raw);
      if(!t.fact_schemas) t.fact_schemas=defaultAnnotationTaxonomy().fact_schemas;
      return t;
    }catch(e){}
  }
  return defaultAnnotationTaxonomy();
}
function saveAnnotationTaxonomy(t){localStorage.setItem("custom_taxonomy_v4",JSON.stringify(t))}
function taxChildren(parent){return getAnnotationTaxonomy().terms.filter(t=>t.parent===parent)}
function taxTerm(id){return getAnnotationTaxonomy().terms.find(t=>t.id===id)}
function taxRootOf(id){
  let t=taxTerm(id); if(!t) return id;
  while(t && t.parent){t=taxTerm(t.parent)}
  return t?t.id:id
}
function factSchemasFor(baseId,kind){
  const root=taxRootOf(baseId);
  return getAnnotationTaxonomy().fact_schemas.filter(s=>s.kind===kind && (s.applies_to||[]).includes(root))
}

function getNarrativeDemo(){
  const raw=localStorage.getItem("narrative_demo_v5"); if(raw){try{return JSON.parse(raw)}catch(e){}}
  return {
    source_caption:"画面人物分上下两排，上排四人盘腿而坐，正观赏舞蹈，人物前面地面上左右各置一盘，盘内置放耳杯。下排四人作舞蹈状，左侧一女子长袖起舞，右侧三女身着曳地长裙，作细步曼舞状。",
    groups:[
      {id:"G1",type:"观众组",count:4,count_type:"exact",layout:"上排",members:[],shared_attributes:[],shared_states:[{name:"posture",value:"盘腿而坐",certainty:"certain"}],shared_actions:[{name:"social_action",value:"观赏",certainty:"certain"}],subgroup_of:null},
      {id:"G2",type:"舞者组",count:4,count_type:"exact",layout:"下排",members:[],shared_attributes:[],shared_states:[],shared_actions:[{name:"performance_action",value:"舞蹈",certainty:"certain"}],subgroup_of:null},
      {id:"G3",type:"人物子组",count:3,count_type:"exact",layout:"右侧",members:[],shared_attributes:[{name:"gender",value:"女",certainty:"certain"},{name:"lower_garment",value:"曳地长裙",certainty:"certain"}],shared_states:[],shared_actions:[{name:"performance_action",value:"细步曼舞",certainty:"certain"}],subgroup_of:"G2"}
    ],
    events:[
      {id:"EV1",family:"PERFORMANCE",type:"舞蹈",region:null,participants:[{node:"G2",role:"performer"},{node:"G1",role:"observer"}],certainty:"certain"}
    ],
    relations:[
      {subject:"G1",predicate:"above",object:"G2",certainty:"certain"},
      {subject:"G3",predicate:"subgroup_of",object:"G2",certainty:"certain"}
    ]
  }
}
function saveNarrativeDemo(d){localStorage.setItem("narrative_demo_v5",JSON.stringify(d))}

/* ===== V6 scene hierarchy and relation support ===== */
function getSceneHierarchy(){
  const custom=getAnnotationTaxonomy().scene_hierarchy;
  if(custom && custom.length) return custom;
  return [
    {id:"SCENE_LIFE",name:"人物生活",children:[
      {id:"SCENE_INTERACTION",name:"人物互动"},
      {id:"SCENE_ATTENDANCE",name:"侍奉"},
      {id:"SCENE_DAILY",name:"日常起居"}
    ]},
    {id:"SCENE_BANQUET",name:"宴饮饮食",children:[
      {id:"SCENE_FEAST",name:"宴饮"},{id:"SCENE_PREP_FEAST",name:"备宴"},
      {id:"SCENE_SERVE_DRINK",name:"进酒/奉茶"},{id:"SCENE_KITCHEN",name:"庖厨"},{id:"SCENE_STORAGE",name:"仓储"}
    ]},
    {id:"SCENE_PERFORMANCE",name:"乐舞娱乐",children:[
      {id:"SCENE_MUSIC",name:"奏乐"},{id:"SCENE_DANCE",name:"舞蹈"},{id:"SCENE_ACROBATICS",name:"百戏"},
      {id:"SCENE_VIEWING",name:"观赏/听琴"},{id:"SCENE_GAME",name:"博弈"}
    ]},
    {id:"SCENE_TRAVEL",name:"出行仪仗",children:[
      {id:"SCENE_PROCESSION",name:"仪仗行进"},{id:"SCENE_CART_TRAVEL",name:"车马出行"},
      {id:"SCENE_RIDING",name:"骑行"},{id:"SCENE_OFFICIAL_TRAVEL",name:"赴任/出行"}
    ]},
    {id:"SCENE_LABOR",name:"生产劳动",children:[
      {id:"SCENE_FARMING",name:"农耕"},{id:"SCENE_GRAZING",name:"放牧"},
      {id:"SCENE_WATER",name:"汲水"},{id:"SCENE_COOKING",name:"厨炊"},{id:"SCENE_POUNDING",name:"舂米"}
    ]},
    {id:"SCENE_HUNTING",name:"狩猎",children:[{id:"SCENE_HUNT",name:"狩猎活动"}]},
    {id:"SCENE_RITUAL",name:"礼仪宗教",children:[
      {id:"SCENE_WORSHIP",name:"礼佛"},{id:"SCENE_SACRIFICE",name:"祭祀"},{id:"SCENE_AUDIENCE",name:"拜谒"}
    ]},
    {id:"SCENE_HISTORY",name:"历史故事",children:[{id:"SCENE_FILIAL",name:"孝行故事"},{id:"SCENE_STORY",name:"历史叙事"}]},
    {id:"SCENE_MYTH",name:"神话祥瑞",children:[{id:"SCENE_AUSPICIOUS",name:"祥瑞"},{id:"SCENE_ASCENSION",name:"升仙/导引"}]},
    {id:"SCENE_CELESTIAL",name:"天象生肖",children:[{id:"SCENE_ZODIAC",name:"生肖"},{id:"SCENE_ASTRAL",name:"天象"}]},
    {id:"SCENE_NATURE",name:"花鸟山水",children:[{id:"SCENE_LANDSCAPE",name:"山水"},{id:"SCENE_FLOWER_BIRD",name:"花鸟"}]},
    {id:"SCENE_ARCH",name:"建筑陈设",children:[{id:"SCENE_BUILDING",name:"建筑"},{id:"SCENE_FURNISHING",name:"陈设"}]},
    {id:"SCENE_ORNAMENT",name:"装饰图案",children:[{id:"SCENE_PATTERN",name:"纹样装饰"}]},
    {id:"SCENE_OTHER",name:"其他",children:[{id:"SCENE_OTHER_SUB",name:"其他"}]}
  ];
}
function getRelationTaxonomy(){
  const rel=(getAnnotationTaxonomy().relations||[]).filter(r=>r.active!==false);
  const extra=[
    {family:"SPATIAL",predicate:"right_of",sub:"ANY",obj:"ANY",active:true},
    {family:"SPATIAL",predicate:"above",sub:"ANY",obj:"ANY",active:true},
    {family:"SPATIAL",predicate:"below",sub:"ANY",obj:"ANY",active:true},
    {family:"SPATIAL",predicate:"beside",sub:"ANY",obj:"ANY",active:true},
    {family:"SPATIAL",predicate:"facing",sub:"HUMAN",obj:"HUMAN",active:true},
    {family:"SPATIAL",predicate:"inside",sub:"ANY",obj:"ANY",active:true},
    {family:"SPATIAL",predicate:"contains",sub:"ANY",obj:"ANY",active:true},
    {family:"INTERACTION",predicate:"carry",sub:"HUMAN",obj:"OBJECT",active:true},
    {family:"INTERACTION",predicate:"ride",sub:"HUMAN",obj:"ANIMAL",active:true},
    {family:"INTERACTION",predicate:"play",sub:"HUMAN",obj:"OBJECT",active:true},
    {family:"NARRATIVE",predicate:"serve",sub:"HUMAN",obj:"HUMAN",active:true},
    {family:"NARRATIVE",predicate:"observe",sub:"HUMAN",obj:"EVENT",active:true},
    {family:"NARRATIVE",predicate:"attend",sub:"HUMAN",obj:"HUMAN",active:true}
  ];
  const m=new Map();
  [...rel,...extra].forEach(r=>m.set(r.family+"::"+r.predicate,r));
  return [...m.values()];
}
function normalizeReviewDraftV6(){
  const d=getReviewDraft();
  if(!d.scene || Array.isArray(d.scene)) d.scene={annotations:[]};
  if(!d.scene.annotations){
    const themes=d.scene.themes||[];
    d.scene.annotations=themes.length ? themes.map((x,i)=>({
      id:"S"+(i+1),level1:"人物生活",level1_id:"SCENE_LIFE",
      level2:x==="人物生活"?"人物互动":x,level2_id:"SCENE_INTERACTION",
      certainty:"probable",evidence:"caption_inference",review_status:"pending"
    })) : [];
  }
  if(!d.scene.annotations.length){
    d.scene.annotations=[{id:"S1",level1:"人物生活",level1_id:"SCENE_LIFE",level2:"人物互动",level2_id:"SCENE_INTERACTION",certainty:"probable",evidence:"caption_inference",review_status:"pending"}];
  }
  d.relations=(d.relations||[]).map((r,i)=>({
    id:r.id||"R"+(i+1),subject:r.subject,predicate:r.predicate,object:r.object,
    family:r.family || (getRelationTaxonomy().find(x=>x.predicate===r.predicate)?.family||"SPATIAL"),
    certainty:r.certainty||"certain",evidence:r.evidence||"visual_geometry",
    ai_confidence:r.ai_confidence??r.ai_meta?.confidence??0.96,
    ai_original:r.ai_original||{subject:r.subject,predicate:r.predicate,object:r.object},
    review_status:r.review_status||"pending"
  }));
  saveReviewDraft(d);return d
}

/* ===== V7: GROUP / EVENT merged into review draft ===== */
function normalizeReviewDraftV7(){
  const d=normalizeReviewDraftV6();

  // GROUP example lives in the same annotation draft as Entity/Relation.
  if(!Array.isArray(d.groups) || !d.groups.length){
    d.groups=[
      {
        id:"G1",
        type:"观众组",
        count:4,
        count_type:"exact",
        layout:"上排",
        members:[],
        subgroup_of:null,
        shared_attributes:[],
        shared_states:[{name:"posture",value:"盘腿而坐",certainty:"certain",evidence:"caption_explicit"}],
        shared_actions:[{name:"social_action",value:"观赏",certainty:"certain",evidence:"caption_explicit"}],
        review_status:"pending",
        ai_confidence:0.86
      },
      {
        id:"G2",
        type:"舞者组",
        count:4,
        count_type:"exact",
        layout:"下排",
        members:[],
        subgroup_of:null,
        shared_attributes:[],
        shared_states:[],
        shared_actions:[{name:"performance_action",value:"舞蹈",certainty:"certain",evidence:"caption_explicit"}],
        review_status:"pending",
        ai_confidence:0.91
      },
      {
        id:"G3",
        type:"人物子组",
        count:3,
        count_type:"exact",
        layout:"右侧",
        members:[],
        subgroup_of:"G2",
        shared_attributes:[
          {name:"gender",value:"女",certainty:"certain",evidence:"caption_explicit"},
          {name:"lower_garment",value:"曳地长裙",certainty:"certain",evidence:"caption_explicit"}
        ],
        shared_states:[],
        shared_actions:[{name:"performance_action",value:"细步曼舞",certainty:"certain",evidence:"caption_explicit"}],
        review_status:"pending",
        ai_confidence:0.88
      }
    ];
  }

  if(!Array.isArray(d.events) || !d.events.length){
    d.events=[
      {
        id:"EV1",
        family:"PERFORMANCE",
        type:"舞蹈",
        region:null,
        participants:[
          {node:"G2",role:"performer"},
          {node:"G1",role:"observer"}
        ],
        certainty:"certain",
        evidence:"caption_explicit",
        review_status:"pending",
        ai_confidence:0.92
      }
    ];
  }

  // Ensure relation example between groups is in the same draft.
  const hasGroupRelation=(d.relations||[]).some(r=>r.subject==="G1" && r.predicate==="above" && r.object==="G2");
  if(!hasGroupRelation){
    d.relations.push({
      id:"R"+((d.relations||[]).length+1),
      family:"SPATIAL",
      predicate:"above",
      subject:"G1",
      object:"G2",
      certainty:"certain",
      evidence:"caption_explicit",
      ai_confidence:0.93,
      ai_original:{subject:"G1",predicate:"above",object:"G2"},
      review_status:"pending"
    });
  }

  saveReviewDraft(d);
  return d;
}

/* ===== V8 workflow/task helpers ===== */
function defaultWorkflowTasks(){
  return [
    {id:"TASK-001",name:"人物图 AI 结果审核",sample_ids:["MURAL-02315"],sample_count:1,reviewer:"reviewer_01",expert:"expert_01",priority:"高",due:"2026-10-02",status:"REVIEW_ASSIGNED",ai_status:"AI_READY",progress:0,created_by:"admin_01"},
    {id:"TASK-002",name:"乐舞图批次审核",sample_ids:["MURAL-02314","MURAL-02312","MURAL-02311"],sample_count:24,reviewer:"reviewer_01",expert:"expert_01",priority:"普通",due:"2026-10-05",status:"IN_REVIEW",ai_status:"AI_READY",progress:9,created_by:"admin_01"},
    {id:"TASK-003",name:"仪仗类专家复核",sample_ids:["MURAL-02313"],sample_count:8,reviewer:"reviewer_02",expert:"expert_01",priority:"高",due:"2026-10-01",status:"EXPERT_REVIEW",ai_status:"AI_READY",progress:8,created_by:"admin_01"},
    {id:"TASK-004",name:"河北卷管理员验收",sample_ids:["MURAL-02190"],sample_count:12,reviewer:"reviewer_02",expert:"expert_02",priority:"普通",due:"2026-10-03",status:"ADMIN_ACCEPTANCE",ai_status:"AI_READY",progress:12,created_by:"admin_01"}
  ]
}
function getWorkflowTasks(){
  const raw=localStorage.getItem("workflow_tasks_v8");
  if(raw){try{return JSON.parse(raw)}catch(e){}}
  const d=defaultWorkflowTasks();localStorage.setItem("workflow_tasks_v8",JSON.stringify(d));return d
}
function saveWorkflowTasks(t){localStorage.setItem("workflow_tasks_v8",JSON.stringify(t))}
function currentUser(){const r=getRole();return APP.roles[r]?.user||"admin_01"}
function currentTask(){
  const id=localStorage.getItem("active_task_id")||"TASK-001";
  return getWorkflowTasks().find(t=>t.id===id)||getWorkflowTasks()[0]
}
function setActiveTask(id){localStorage.setItem("active_task_id",id)}
function taskStatusLabel(s){
  return {
    AI_QUEUED:"AI排队",AI_RUNNING:"AI处理中",AI_READY:"AI已完成",
    REVIEW_ASSIGNED:"待审核员处理",IN_REVIEW:"审核中",REVIEWED:"审核员已提交",
    EXPERT_REVIEW:"专家复核中",EXPERT_REVIEWED:"专家已通过",
    ADMIN_ACCEPTANCE:"待管理员验收",APPROVED:"已批准",RETURNED:"已退回"
  }[s]||s
}
function workflowStageIndex(status){
  if(["AI_QUEUED","AI_RUNNING","AI_READY"].includes(status)) return 0;
  if(["REVIEW_ASSIGNED","IN_REVIEW","REVIEWED"].includes(status)) return 1;
  if(["EXPERT_REVIEW","EXPERT_REVIEWED"].includes(status)) return 2;
  if(["ADMIN_ACCEPTANCE","APPROVED"].includes(status)) return 3;
  return 1
}
function renderWorkflowStrip(status){
  const names=[["AI","自动标注"],["Reviewer","审核员"],["Expert","专家审核员"],["Admin","管理员验收"]];
  const idx=workflowStageIndex(status);
  return names.map((x,i)=>`<div class="wf-step ${i<idx?'done':i===idx?'active':'wait'}"><div class="n">${x[0]}</div><div class="t">${x[1]}</div></div>${i<names.length-1?'<span class="wf-arrow">→</span>':''}`).join("")
}

/* ===== V9 user & role management ===== */
function defaultUsers(){
  return [
    {id:"U001",username:"admin_01",name:"项目管理员",role:"admin",status:"active"},
    {id:"U002",username:"reviewer_01",name:"审核员一",role:"reviewer",status:"active"},
    {id:"U003",username:"reviewer_02",name:"审核员二",role:"reviewer",status:"active"},
    {id:"U004",username:"reviewer_03",name:"审核员三",role:"reviewer",status:"active"},
    {id:"U005",username:"expert_01",name:"专家一",role:"expert",status:"active"},
    {id:"U006",username:"expert_02",name:"专家二",role:"expert",status:"active"},
    {id:"U007",username:"researcher_01",name:"研究用户",role:"researcher",status:"active"}
  ]
}
function getUsers(){
  const raw=localStorage.getItem("users_v9");
  if(raw){try{return JSON.parse(raw)}catch(e){}}
  const d=defaultUsers();localStorage.setItem("users_v9",JSON.stringify(d));return d
}
function saveUsers(v){localStorage.setItem("users_v9",JSON.stringify(v))}
function defaultRoles(){
  return [
    {code:"admin",name:"管理员",description:"项目配置、数据、任务分配、AI配置、最终验收",permissions:["project.manage","sample.manage","ai.manage","task.assign","workflow.manage","taxonomy.manage","qc.manage","user.manage","role.manage","approve.final","export.all"],system:true},
    {code:"reviewer",name:"标注审核员",description:"处理分配给自己的 AI 标注审核任务",permissions:["task.mine","annotation.review","json.preview","history.mine"],system:true},
    {code:"expert",name:"专家审核员",description:"处理分配给自己的专家复核任务",permissions:["expert.mine","annotation.review","taxonomy.read","json.preview","history.expert"],system:true},
    {code:"researcher",name:"只读研究员",description:"只读浏览 Approved 数据并按授权导出",permissions:["approved.read","version.read","export.approved"],system:true}
  ]
}
function getRoles(){
  const raw=localStorage.getItem("roles_v9");
  if(raw){try{return JSON.parse(raw)}catch(e){}}
  const d=defaultRoles();localStorage.setItem("roles_v9",JSON.stringify(d));return d
}
function saveRoles(v){localStorage.setItem("roles_v9",JSON.stringify(v))}
function usersByRole(role){return getUsers().filter(u=>u.role===role && u.status==="active")}
function userLabel(username){const u=getUsers().find(x=>x.username===username);return u?`${u.name}（${u.username}）`:username}
function defaultAssignableMurals(){
  return [
    {id:"MURAL-02315",name:"人物图",caption:"绘一男一女。左侧男子头戴尖山小冠，身穿淡土红色交社衫，拱手，似施礼。右侧女子头梳倭堕髻，身穿淡土红色交社百戏衫，系淡土红色曳地长裙。腹部隆起，左手置腹前，右手指点。",risk:62,status:"AI_READY",volume:"示例卷",selected:true},
    {id:"MURAL-02314",name:"乐舞图",caption:"画面人物分上下两排，上排四人盘腿而坐，正观赏舞蹈，人物前面地面上左右各置一盘，盘内置放耳杯。下排四人作舞蹈状，左侧一女子长袖起舞，右侧三女身着曳地长裙，作细步曼舞状。",risk:78,status:"AI_READY",volume:"示例卷",selected:true},
    {id:"MURAL-02312",name:"仪仗人物图",caption:"画面可见多人组成仪卫行列。",risk:71,status:"AI_READY",volume:"示例卷",selected:false},
    {id:"MURAL-02311",name:"宴饮图",caption:"画面上部为宴饮，下部为厨炊。",risk:55,status:"AI_READY",volume:"示例卷",selected:false},
    {id:"MURAL-02310",name:"车马出行图",caption:"人物与车马组成出行队列。",risk:83,status:"AI_READY",volume:"示例卷",selected:false},
    {id:"MURAL-02309",name:"门吏图",caption:"门侧立一人，似为文职幕僚。",risk:88,status:"AI_READY",volume:"示例卷",selected:false},
    {id:"MURAL-02308",name:"朱雀图",caption:"画面绘朱雀形象。",risk:31,status:"AI_READY",volume:"示例卷",selected:false},
    {id:"MURAL-02307",name:"庖厨图",caption:"画面表现厨炊活动与器物。",risk:60,status:"AI_READY",volume:"示例卷",selected:false}
  ]
}
function getAssignableMurals(){
  const raw=localStorage.getItem("assignable_murals_v9");
  if(raw){try{return JSON.parse(raw)}catch(e){}}
  const d=defaultAssignableMurals();localStorage.setItem("assignable_murals_v9",JSON.stringify(d));return d
}
function saveAssignableMurals(v){localStorage.setItem("assignable_murals_v9",JSON.stringify(v))}

/* ================= 全栈同步层（真实后端版，追加段） =================
 * 原有逻辑零改动。本段实现：
 * 1) 启动时从后端 GET /api/bootstrap 拉取全量 state 灌入 localStorage（服务端为唯一事实源）
 * 2) 重定义 save* 函数：本地写入的同时镜像 POST /api/state/{key} 到后端
 * 3) 新增 saveAICandidate：AI 运行结果入库（localStorage + 服务端）
 * 后端不可达时（如离线双击打开 html）自动退回纯 localStorage 模式，页面行为不变。
 */
(function _bootSync(){
  try{
    var xhr=new XMLHttpRequest();xhr.open('GET','/api/bootstrap',false);xhr.send(null);
    if(xhr.status===200){
      var state=JSON.parse(xhr.responseText);
      for(var k in state){localStorage.setItem(k,JSON.stringify(state[k]))}
    }
  }catch(e){}
})();
function _pushState(key,value){
  try{
    var xhr=new XMLHttpRequest();xhr.open('POST','/api/state/'+encodeURIComponent(key),true);
    xhr.setRequestHeader('Content-Type','application/json;charset=utf-8');
    xhr.send(JSON.stringify(value));
  }catch(e){}
}
function setSampleMeta(meta){localStorage.setItem('sample_meta',JSON.stringify(meta));_pushState('sample_meta',meta)}
function saveReviewDraft(d){localStorage.setItem('review_draft_v3',JSON.stringify(d));_pushState('review_draft_v3',d)}
function saveAnnotationTaxonomy(t){localStorage.setItem("custom_taxonomy_v4",JSON.stringify(t));_pushState('custom_taxonomy_v4',t)}
function saveNarrativeDemo(d){localStorage.setItem("narrative_demo_v5",JSON.stringify(d));_pushState('narrative_demo_v5',d)}
function saveWorkflowTasks(t){localStorage.setItem("workflow_tasks_v8",JSON.stringify(t));_pushState('workflow_tasks_v8',t)}
function saveUsers(v){localStorage.setItem("users_v9",JSON.stringify(v));_pushState('users_v9',v)}
function saveRoles(v){localStorage.setItem("roles_v9",JSON.stringify(v));_pushState('roles_v9',v)}
function saveAssignableMurals(v){localStorage.setItem("assignable_murals_v9",JSON.stringify(v));_pushState('assignable_murals_v9',v)}
function saveAICandidate(muralId,candidate){
  var key='ai_candidate_'+muralId;
  localStorage.setItem(key,JSON.stringify(candidate));_pushState(key,candidate);
  return key;
}
