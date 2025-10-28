import React, { createContext, useState, useContext, ReactNode } from 'react';
// 导入本地文件系统管理器
import { loadProjectFromFile, ProjectFileStructure } from '@/utils/localFileSystemManager';

// 定义项目相关的类型
export interface Scene {
  id: string;
  description: string;
  imageUrl?: string;
  duration: number;
  cameraAngle: string;
  dialogues?: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  script: string;
  scenes: Scene[];
  videoUrl?: string;
}

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  createProject: (title: string, description: string) => void;
  setCurrentProject: (project: Project | null) => void;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  addScene: (projectId: string, scene: Omit<Scene, 'id'>) => void;
  updateScene: (projectId: string, sceneId: string, scene: Partial<Scene>) => void;
  deleteScene: (projectId: string, sceneId: string) => void;
  // 添加从本地文件导入项目的新函数
  importProjectFromFile: (file: File) => Promise<void>;
}

// 创建上下文
export const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// 提供上下文的组件
export function ProjectContextProvider({ children }: { children: ReactNode }) {
  // 从localStorage加载项目
  const [projects, setProjects] = useState<Project[]>(() => {
    const savedProjects = localStorage.getItem('storyvision-projects');
    if (savedProjects) {
      const parsedProjects = JSON.parse(savedProjects);
      // 转换日期字符串为Date对象
      return parsedProjects.map((project: any) => ({
        ...project,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt)
      }));
    }
    
     // 返回默认的示例项目
     return [
       {
         id: '1',
         title: '神秘森林探险',
         description: '一个关于冒险家和神秘生物的故事',
         createdAt: new Date('2025-09-15'),
         updatedAt: new Date('2025-09-17'),
         script: '第一幕：森林入口\n\n[镜头缓缓推进，展示一片茂密的森林，阳光透过树叶洒下斑驳的光影。]\n\n探险家李明（30岁左右，背着背包，手持地图）站在森林边缘，抬头望着这片神秘的森林。\n\n李明：（自言自语）这就是传说中的神秘森林吗？我一定要找到那座古老的神庙。\n\n[镜头切换到李明的面部表情，显示出他的决心和一丝紧张。]\n\n[背景音乐逐渐增强，营造出紧张而神秘的氛围。]\n\n第二幕：森林深处\n\n[李明在森林中穿行，周围的树木越来越高大，阳光越来越少。]\n\n[突然，一阵奇怪的声音从远处传来。李明停下脚步，警惕地环顾四周。]\n\n李明：（小声）谁在那里？\n\n[镜头特写：一只色彩斑斓的小鸟从树枝上飞起，打破了寂静。李明松了一口气，继续前行。]\n\n[镜头拉远，显示在李明的后方，有一个模糊的身影在跟踪他...]\n\n第三幕：发现神庙\n\n[李明穿过一片灌木丛，眼前豁然开朗。一座古老的神庙出现在他面前，虽然已经破败，但依然能看出当年的宏伟。]\n\n李明：（惊叹）哇，真是太美了！\n\n[镜头从李明的视角展示神庙的全貌，然后缓缓推进到神庙的入口。]\n\n[李明小心翼翼地走向神庙，推开那扇沉重的石门...]\n\n[音乐达到高潮，画面渐暗。]\n\n—— 第一集 完 ——',
         scenes: [
           {
             id: '1-1',
             description: '森林入口，探险家李明站在森林边缘，抬头望着这片神秘的森林',
             imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=adventurer%20standing%20at%20the%20edge%20of%20a%20mysterious%20forest%20sunlight%20through%20trees&sign=00c9905f97a1c048ffc59dd63385da7e',
             duration: 5,
             cameraAngle: '全景',
             dialogues: ['这就是传说中的神秘森林吗？我一定要找到那座古老的神庙。']
           },
           {
             id: '1-2',
             description: '李明在森林中穿行，周围的树木越来越高大，阳光越来越少',
             imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=adventurer%20walking%20through%20dense%20forest%20tall%20trees%20mystical%20atmosphere&sign=6c9c1f8768e03485b2fff409a87720ff',
             duration: 4,
             cameraAngle: '跟拍'
           },
           {
             id: '1-3',
             description: '一座古老的神庙出现在李明面前，虽然已经破败，但依然能看出当年的宏伟',
             imageUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=ancient%20ruined%20temple%20in%20the%20middle%20of%20forest%20majestic%20atmosphere&sign=f1b7c0228627179e9174b0ac750573dd',
             duration: 6,
             cameraAngle: '远景',
             dialogues: ['哇，真是太美了！']
           }
         ]
       },
       {
         id: '2',
         title: '儒圣录·草堂风波',
         description: '一个关于儒圣陈默、太子赵祯和武馆教头周虎之间的故事',
         createdAt: new Date('2025-09-18'),
         updatedAt: new Date('2025-09-19'),
         script: '# 剧本标题：《儒圣录·草堂风波》\n**注：剧本以“七年隐居”为时间起点，用细节暗示角色身份（如太子袖口暗纹、先生的内力控制），保留小说核心冲突与人物弧光。**\n\n\n## 场景1：小城·青桐草堂 （日·外）\n*【午后日光穿过老梧桐树的枝叶，在青石板上织成细碎的金网。草堂的竹门挂着褪色的布帘，帘内飘出墨香与孩童的读书声。】*\n*【镜头推近：堂内案几上摊着《礼记》，纸页边缘卷着毛边——**陈默**（儒圣，三十岁上下，白衣沾着淡墨渍，指尖夹着一支羊毫笔，正给几个孩童圈点经文）。他的坐姿挺拔如松，袖口垂落时，隐约可见腕间系着一串用旧的紫檀佛珠（前朝儒门信物）。】*\n*【旁边石凳上，**赵祯**（太子，十四岁，青衫袖口绣着极淡的龙纹暗绣，正蹲在石磨前磨墨。他攥着墨锭的手劲太大，墨汁溅在裤脚，却盯着陈默的背影，眼神里带着少年人的跃跃欲试）。】*\n\n*【孩童们摇头晃脑念着：“修身齐家治国平天下……”陈默忽然抬手，指尖轻叩案几——**“啪”**的一声，最边上的孩童差点碰翻茶盏，茶盏却稳稳停在案边，茶水连涟漪都没泛起（暗示内力）。】*\n\n**陈默**（声音清润如溪，带着教书先生的温和）：阿竹，“治”字要沉气，别像赶鸭子似的。\n\n*【突然，**“哐当”**一声！竹门被人踹开，木屑飞溅。**周虎**（武馆教头，三十五六岁，粗布短打，胸口刺着“武”字纹身，腰间挂着空酒葫芦，袖中藏着一根铁尺）骂骂咧咧撞进来，身后跟着四五个攥着锄头的村民（学生家长）。】*\n\n**周虎**（扯着嗓子吼，唾沫星子溅到门帘上）：陈默！你个酸丁敢抢老子生意？！\n\n*【孩童们吓得缩成一团，赵祯猛地站起来，墨锭“啪”地砸在石磨上，攥紧了腰间的玉佩（那是先帝赐的龙纹佩）。陈默却没抬头，继续用毛笔蘸墨，纸页上的字竟**无风自动**（内力溢出）。】*\n\n**陈默**（缓缓放下笔，抬眼时目光像浸了冰水的剑）：周教头，这门是阿福前日刚编的，要赔。\n\n**周虎**（上前一步，拍碎身边的竹椅扶手）：赔个屁！老子武馆这半个月连个毛都没收到！都是你这破草堂勾走了娃娃们的魂！（拽过一个穿粗布的妇人）张婶，你家阿牛是不是要退学？！\n\n**张婶**（搓着衣角，眼神躲闪）：陈先生……阿牛说、说学武能当将军，比背书强……\n\n**周虎**（拍着胸脯，肌肉鼓得像块石头）：听见没？大丈夫就该提刀杀人！学那酸文假醋能当饭吃？！（突然指向陈默，铁尺“啪”地拍在案几上）给你两天时间——要么关了草堂滚蛋，要么老子一把火烧了这破竹子堆！\n\n*【赵祯猛地站起，手按向腰间（那里藏着先帝赐的短刀），却被陈默轻轻按住肩膀。陈默的指尖带着温热的内力，赵祯只觉得肩膀一沉，竟半步都动不了。】*\n\n**赵祯**（压低声音，带着少年人的急脾气）：先生！我去叫禁卫军——这泼皮敢威胁你！\n\n**陈默**（摇头，指尖抚过被周虎拍裂的案几——裂缝竟慢慢愈合，连痕迹都没留下）：祯儿，先听他说。\n\n*【周虎注意到案几的变化，瞳孔猛地缩了缩，却仍嘴硬地啐了一口。】*\n\n**周虎**（色厉内荏）：装神弄鬼！你要是真有本事，敢跟老子单挑？！\n\n**陈默**（拿起案上的茶盏，抿了一口）：周教头昨日帮王婆挑了两担水，今日清晨给老李家修了篱笆——这些事，比你在这里喊打喊杀，更像“大丈夫”该做的。\n\n*【周虎愣了愣，脸上的横肉僵了僵——他确实偷偷帮过村民，但从没人提过。】*\n\n**陈默**（放下茶盏，目光扫过村民）：各位乡亲，文是“根”，武是“枝”。没有“根”的树，风一吹就倒。你们想让孩子当将军，可将军要读兵书、懂阵法，难道靠蛮力气砍人？\n\n*【村民们面面相觑，张婶攥着锄头的手慢慢松开。周虎却急了，伸手去抓案上的《礼记》——**陈默**忽然抬袖，一阵微风卷过，《礼记》稳稳落在他怀里，周虎的手却“啪”地拍在案几上，疼得他直咧嘴。】*\n\n**周虎**（捂着手后退，恶狠狠地放狠话）：你等着！两天后要是还在，老子烧了这破地方！（转身撞开人群，骂骂咧咧走了）\n\n*【村民们你看看我，我看看你，最后张婶走上前，搓着衣角小声说：“陈先生，阿牛……还是先学几天？要是他闹着要走，我再……”】*\n\n**陈默**（笑着点头，递过一本翻旧的《三字经》）：阿牛识字快，这本给他当课外书。\n\n*【村民们散了，赵祯却还攥着墨锭，腮帮子鼓得像包子。】*\n\n**赵祯**（跺脚）：先生！他都要烧草堂了，你还忍？！\n\n**陈默**（弯腰捡起赵祯脚边的墨锭，用袖口擦了擦他裤脚的墨渍）：当年前朝武圣挥刀砍向儒门时，我也想过杀他。可后来我明白——（指尖点了点赵祯的胸口）**拳头能服人一时，道理能服人一世**。你是要当皇帝的人，不能学武夫的急脾气。\n\n*【赵祯低头看着陈默的手，喉结动了动，慢慢攥住墨锭，重新蹲回石磨边。】*\n\n\n## 场景2：草堂前院 （日·外）\n*【周虎刚走，院外传来**“哒哒”**的马蹄声。一辆装饰华丽的马车停在门口，**叶昭**（叶家千金，二十岁，穿月白骑装，腰间挂着翡翠剑鞘，发间插着一支金步摇）翻身下马，动作利落得像个江湖人。她摘下鎏金抹额扔给婢女，大步往堂里走。】*\n\n**叶昭**（喊得中气十足）：陈先生！我家那不成器的弟弟呢？！\n\n*【陈默从堂内出来，看见叶昭，眉梢挑了挑——他认得那柄剑鞘，是前朝公主的陪嫁（暗示叶家与皇室的关系）。】*\n\n**陈默**（拱手，笑着调侃）：叶姑娘的马又踩坏了王伯的菜地？\n\n**叶昭**（把剑往案几上一放，剑鞘撞得案几响）：踩菜地算什么！我弟昨日把我爹的和田玉砚摔碎了！（拽着陈默的袖子晃了晃，语气软下来）陈先生，你务必收他——不然我爹要打断他的腿！\n\n*【赵祯凑过来，盯着剑鞘上的花纹，眼睛发亮：“这是……前朝长乐公主的剑？”】*\n\n**叶昭**（揉了揉赵祯的头，笑得狡黠）：小娃娃眼睛倒尖。当年你先生救过我爹的命，这剑是谢礼。\n\n*【陈默的手指轻轻碰了碰剑鞘，剑鞘上的翡翠突然泛起微光——叶昭瞳孔一缩，立刻明白陈默在试探剑的来历（暗示两人当年的交集）。】*\n\n**陈默**（收回手，笑着摇头）：叶小公子的脾气，我上次见识过——他把我种的兰花拔了，说是“要练剑斩草”。\n\n**叶昭**（翻了个白眼）：所以才要你管！我娘说，只有你能治住他的混劲儿！（从袖中掏出一张银票拍在案上）这是束脩，不够我再补！\n\n*【陈默拿起银票，指尖轻轻一弹——银票竟“唰”地飞回去，稳稳落在叶昭手里。】*\n\n**陈默**（语气认真）：束脩要收，但得等叶小公子愿意坐下来读书。你先把他带来，我跟他聊聊“斩草”的道理。\n\n*【叶昭愣了愣，忽然笑出声，重新把银票塞进陈默手里：“成！我明日就把他绑来！”】*\n\n*【镜头拉远：陈默站在院门口，望着叶昭的马车远去。赵祯捧着那本《礼记》走过来，翻到“以德服人”那一页，指尖轻轻摩挲着纸页。】*\n\n**赵祯**（小声说）：先生，我刚才懂了——你不是怕周虎，是想让他自己醒过来。\n\n**陈默**（抬头望着天上的云，声音轻得像风）：等你当了皇帝，会遇到很多比周虎更蛮的人。（转头看向赵祯，眼睛里有光）**比刀剑更厉害的，是人心**。\n\n*【风掀起陈默的白衣，吹得院角的兰花晃了晃。远处传来孩童的读书声，混着叶昭的马车声，慢慢飘向天空。】*\n\n\n## 场景3：草堂后巷 （日·外）\n*【周虎蹲在巷口的老槐树下，摸出怀里的酒壶灌了一口。他盯着自己的手——刚才陈默碰过的地方，还留着淡淡的温热。巷口的老妇人端着一碗粥走过来，递给他。】*\n\n**老妇人**（叹气）：周教头，陈先生是个好人，你别找他麻烦了。\n\n**周虎**（捏着酒壶的手紧了紧，声音闷闷的）：我知道……可武馆的房租要交了，我娘还在病床上……\n\n*【镜头切回草堂：陈默站在案前，望着窗外的梧桐树，指尖摩挲着佛珠。赵祯磨完墨，忽然开口。】*\n\n**赵祯**（犹豫着）：先生，我让人给周教头送点银子？\n\n**陈默**（摇头，却笑了）：不用。他会自己想明白的——（指了指案上的《论语》）**“君子务本，本立而道生”**。\n\n*【镜头渐黑，背景音是孩童的读书声，越来越响……】*\n\n\n**注：剧本保留“先生的隐忍”“太子的成长”“教头的隐情”三条暗线，为后续“烧草堂冲突”“教头倒戈”埋下伏笔；叶家千金的出场则衔接“京城势力”的支线，呼应小说中“先生与皇室的关联”。**',
         scenes: [
           {
             id: '2-1',
             description: '小城·青桐草堂 日·外 - 午后日光穿过老梧桐树的枝叶，陈默给孩童们圈点经文，赵祯蹲在石磨前磨墨',
             duration: 8,
             cameraAngle: '全景'
           },
           {
             id: '2-2',
             description: '武馆教头周虎带着村民闹事，陈默用内力展示化解冲突',
             duration: 10,
             cameraAngle: '中景'
           },
           {
             id: '2-3',
             description: '叶家千金叶昭来访，带来与皇室有关的线索',
             duration: 7,
             cameraAngle: '近景'
           },
           {
             id: '2-4',
             description: '周虎在巷口独自饮酒，露出内心的矛盾；陈默与赵祯对话，阐明处世之道',
             duration: 6,
             cameraAngle: '远景'
           }
         ]
       }
     ];
  });

  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // 保存项目到localStorage
  const saveProjectsToLocalStorage = (updatedProjects: Project[]) => {
    localStorage.setItem('storyvision-projects', JSON.stringify(updatedProjects));
  };

  // 创建新项目
  const createProject = (title: string, description: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      title,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      script: '',
      scenes: []
    };
    
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    setCurrentProject(newProject);
    saveProjectsToLocalStorage(updatedProjects);
  };

  // 更新项目
  const updateProject = (updatedProject: Project) => {
    const updatedProjects = projects.map(project => 
      project.id === updatedProject.id 
        ? { ...updatedProject, updatedAt: new Date() } 
        : project
    );
    
    setProjects(updatedProjects);
    
    if (currentProject && currentProject.id === updatedProject.id) {
      setCurrentProject({ ...updatedProject, updatedAt: new Date() });
    }
    
    saveProjectsToLocalStorage(updatedProjects);
  };

  // 删除项目
  const deleteProject = (projectId: string) => {
    const updatedProjects = projects.filter(project => project.id !== projectId);
    setProjects(updatedProjects);
    
    if (currentProject && currentProject.id === projectId) {
      setCurrentProject(null);
    }
    
    saveProjectsToLocalStorage(updatedProjects);
  };

  // 添加场景
  const addScene = (projectId: string, scene: Omit<Scene, 'id'>) => {
    const newScene: Scene = {
      ...scene,
      id: `${projectId}-${Date.now()}`
    };
    
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          scenes: [...project.scenes, newScene],
          updatedAt: new Date()
        };
      }
      return project;
    });
    
    setProjects(updatedProjects);
    
    if (currentProject && currentProject.id === projectId) {
      setCurrentProject({
        ...currentProject,
        scenes: [...currentProject.scenes, newScene],
        updatedAt: new Date()
      });
    }
    
    saveProjectsToLocalStorage(updatedProjects);
  };

  // 更新场景
  const updateScene = (projectId: string, sceneId: string, scene: Partial<Scene>) => {
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          scenes: project.scenes.map(s => 
            s.id === sceneId ? { ...s, ...scene } : s
          ),
          updatedAt: new Date()
        };
      }
      return project;
    });
    
    setProjects(updatedProjects);
    
    if (currentProject && currentProject.id === projectId) {
      setCurrentProject({
        ...currentProject,
        scenes: currentProject.scenes.map(s => 
          s.id === sceneId ? { ...s, ...scene } : s
        ),
        updatedAt: new Date()
      });
    }
    
    saveProjectsToLocalStorage(updatedProjects);
  };

  // 删除场景
  const deleteScene = (projectId: string, sceneId: string) => {
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          scenes: project.scenes.filter(s => s.id !== sceneId),
          updatedAt: new Date()
        };
      }
      return project;
    });
    
    setProjects(updatedProjects);
    
    if (currentProject && currentProject.id === projectId) {
      setCurrentProject({
        ...currentProject,
        scenes: currentProject.scenes.filter(s => s.id !== sceneId),
        updatedAt: new Date()
      });
    }
    
    saveProjectsToLocalStorage(updatedProjects);
  };

  // 从本地文件导入项目
  const importProjectFromFile = async (file: File): Promise<void> => {
    try {
      // 加载项目文件
      const projectData: ProjectFileStructure = await loadProjectFromFile(file);
      
      // 检查项目是否已存在
      const existingProject = projects.find(p => p.id === projectData.project.id);
      
      if (existingProject) {
        // 如果项目已存在，更新它
        const updatedProjects = projects.map(project => 
          project.id === projectData.project.id 
            ? { ...projectData.project, updatedAt: new Date() } 
            : project
        );
        
        setProjects(updatedProjects);
        setCurrentProject({ ...projectData.project, updatedAt: new Date() });
        saveProjectsToLocalStorage(updatedProjects);
      } else {
        // 如果项目不存在，添加它
        const updatedProjects = [...projects, projectData.project];
        setProjects(updatedProjects);
        setCurrentProject(projectData.project);
        saveProjectsToLocalStorage(updatedProjects);
      }
    } catch (error) {
      console.error('导入项目失败:', error);
      throw error;
    }
  };

  const contextValue: ProjectContextType = {
    projects,
    currentProject,
    createProject,
    setCurrentProject,
    updateProject,
    deleteProject,
    addScene,
    updateScene,
    deleteScene,
    importProjectFromFile // 添加新函数到上下文值
  };

  return React.createElement(
    ProjectContext.Provider,
    { value: contextValue },
    children
  );
}

// 自定义Hook以便使用上下文
export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectContextProvider');
  }
  return context;
};