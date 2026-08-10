// One-off backfill: add seoDescription + keywords to every article source file.
// Usage: node scripts/backfill-article-seo.mjs          (dry run)
//        node scripts/backfill-article-seo.mjs --apply  (write files)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// key = filename without .md; value = { seoDescription, keywords }
const SEO = {
  // ---------- stories ----------
  '10432746': {
    seoDescription: '一位跨性别者眼中的二元性别世界：社会被非黑即白的性别框架塑造，为过渡态、非二元与神经多样人群留下太少空间。',
    keywords: ['跨性别', '非二元', '性别二元论', '社会观察'],
  },
  '10755068': {
    seoDescription: '关于真实生活体验（RLE）的温柔提醒：按照自己的节奏和接受程度慢慢来，不必急于证明自己。',
    keywords: ['跨性别', 'RLE', '真实生活体验', '自我接纳'],
  },
  '11216931': {
    seoDescription: '幼时对好友的朦胧情愫与自我认同纠缠不清：是喜欢她，还是想成为她？一段真挚的自我探索独白。',
    keywords: ['跨性别', '性别认同', '自我探索', '青春期'],
  },
  '11296859': {
    seoDescription: '为购买激素药物四处尝试却屡购假货、损失数万元的亲身经历，呼吁社会包容并拓宽跨性别者安全购药渠道。',
    keywords: ['跨性别', 'HRT药物', '购药经历', '社会包容'],
  },
  '13921621': {
    seoDescription: '一位跨性别女性的朋友于2021年离世，留下遗书托付她去看看这个美丽的世界——她做到了，并将继续前行。',
    keywords: ['跨性别', '生命', '怀念', '互助'],
  },
  '15131742': {
    seoDescription: '面对残酷命运的宣言：带着愤怒也带着希望，大口撕咬生活，跨性别者也要骄傲地活下去。',
    keywords: ['跨性别', '抗争', '生命力', '骄傲'],
  },
  '15261031': {
    seoDescription: '一位实习中的跨性别者分享：为应对繁重实习带来的身心压力，冒险启动激素替代治疗以缓解身体焦虑。',
    keywords: ['跨性别', 'HRT', '实习压力', '身体焦虑'],
  },
  '16157706': {
    seoDescription: '被社会放逐荒野的我们，需要在荒原上扎根：保持悲悯、坚强勇敢，在废墟上建起属于自己的王国。',
    keywords: ['跨性别', '社群', '勇气', '生存'],
  },
  '16788647': {
    seoDescription: '因跨性别身份遭受迫害，最终在欧洲获得政治庇护的真实经历。',
    keywords: ['跨性别', '政治庇护', '迫害'],
  },
  '17553176': {
    seoDescription: '简短而有力的鼓励：勇敢做自己，跨性别者不需要活在别人的定义里。',
    keywords: ['跨性别', '勇敢做自己', '自我接纳'],
  },
  '17771534': {
    seoDescription: '一句庆幸的分享：历经波折后苦尽甘来，是跨性别路上难得的幸运时刻。',
    keywords: ['跨性别', '苦尽甘来', '幸运'],
  },
  '18341625': {
    seoDescription: '一位23岁的跨性别者感慨：虽然不得不在指派性别下生活，但亲友的支持让她能偶尔做真实的自己。',
    keywords: ['跨性别', '亲友支持', '性别认同', '真实自我'],
  },
  '19765145': {
    seoDescription: '激素治疗开始得晚、家庭观念保守，但依然对身心的改变充满期待，并希望早日减肥成功的轻松分享。',
    keywords: ['跨性别', 'HRT', '乐观', '自我期待'],
  },
  '19770785': {
    seoDescription: '从911谈起，思考21世纪的地缘政治与文明冲突，以及20世纪各受压迫群体争取被看见的历史。',
    keywords: ['跨性别', '社会观察', '历史', '弱势群体'],
  },
  '22291300': {
    seoDescription: '别怀疑自己是否“足够跨性别”，想做就去做；但有时，我们也需要有人温柔地推自己一把。',
    keywords: ['跨性别', '自我怀疑', '支持'],
  },
  '22730020': {
    seoDescription: '高三读恩格斯的《家庭、私有制和国家的起源》后深受冲击，开始厌恶自己的指派男性身份，走向性别觉醒。',
    keywords: ['跨性别', '性别焦虑', '觉醒', '思想启蒙'],
  },
  '23280636': {
    seoDescription: '一个温柔而坚定的愿望：希望大家都平安走过这条路，自己也要活着看到小行星、火箭和成为女孩的那一天。',
    keywords: ['跨性别', '希望', '活下去', '梦想'],
  },
  '23799894': {
    seoDescription: '曾经燃烧自己照亮他人，如今却在怀疑自己还能否继续闪耀——一段疲惫而真实的内心独白。',
    keywords: ['跨性别', '自我怀疑', '疲惫', '内心独白'],
  },
  '23866319': {
    seoDescription: '因跨性别身份被赶出家门，心理状态每况愈下——一段求助式的真实处境记录。',
    keywords: ['跨性别', '家庭冲突', '心理健康'],
  },
  '23925115': {
    seoDescription: '一位日本方向的国际学生想学心理学或社会学，走上医疗或政治领域，让后辈们活成自己应有的样子。',
    keywords: ['跨性别', '国际学生', '心理学', '未来'],
  },
  '24674470': {
    seoDescription: '这个世界还没那么坏——至少朋友都很好。一句对善意与联结的朴素信任。',
    keywords: ['跨性别', '友谊', '温暖'],
  },
  '24696582': {
    seoDescription: '为了所有活着和逝去的同类：不要忘记过去，不要停止愤怒，不要放弃斗争，也不要宽恕。',
    keywords: ['跨性别', '记忆', '抗争', '社群'],
  },
  '26660035': {
    seoDescription: '“凭什么我要过得不好？”——一个不服输的跨性别者拒绝任何标签，选择无条件信任自己、培养自己、爱自己。',
    keywords: ['跨性别', '自我认同', '自信', '抗争'],
  },
  '26898184': {
    seoDescription: '曾以为善意可以改变世界，却发现世界依然糟糕——一段理想落空的失望与清醒。',
    keywords: ['跨性别', '失望', '社会观察'],
  },
  '27597280': {
    seoDescription: '一位已走出心理创伤的跨性别者的祝愿：希望大家都能早日走出阴影，迎来自己的光。',
    keywords: ['跨性别', '心理创伤', '康复', '祝愿'],
  },
  '27873052': {
    seoDescription: '一段沉重的经历：曾为同校的跨性别者提供药物，随后两人相继试图轻生又被抢救，被迫长假休整。',
    keywords: ['跨性别', '心理健康', '危机', '互助'],
  },
  '28112431': {
    seoDescription: '想要燃烧自己，为后来的人铺路——一代人的自我牺牲与接力。',
    keywords: ['跨性别', '奉献', '社群传承'],
  },
  '28374609': {
    seoDescription: '如果名字被剥夺，就用行动为自己命名，用照护与互相支持来守护它。',
    keywords: ['跨性别', '身份', '互助', '尊严'],
  },
  '28528188': {
    seoDescription: '因与跨性别无关的原因被父母遗弃，叠加重重困境：22岁才开始激素治疗，并因抚养纠纷被迫失学。',
    keywords: ['跨性别', '家庭遗弃', 'HRT', '困境'],
  },
  '29480710': {
    seoDescription: '极简而沉重的一句：活着就是为了感受死去。对生命与死亡的存在主义叩问。',
    keywords: ['跨性别', '生命', '存在主义'],
  },
  '29506242': {
    seoDescription: '因严重精神障碍辍学的非二元者，正在努力成为画师，为非二元群体争取更多可见度。',
    keywords: ['非二元', 'enby', '艺术', '可见度'],
  },
  '30858891': {
    seoDescription: '跨性别男性的处境同样不容乐观——一句简短的现状观察。',
    keywords: ['跨性别男性', 'MTX', '生存现状'],
  },
  '32671890': {
    seoDescription: '复读中的跨性别学生给自己打气：将来会有的，一切都会好起来。',
    keywords: ['跨性别', '复读', '学生', '希望'],
  },
  '32806219': {
    seoDescription: '即使父亲已不再是监护人，仍坚持用错误的性别称呼自己——被最亲近的人反复误称的痛苦。',
    keywords: ['跨性别', '误称', '家庭关系', '痛苦'],
  },
  '33234228': {
    seoDescription: '见过十岁开始激素治疗、三十多岁无力手术、也有欣然赴死的同类——每个人都有自己的难处，请好好爱自己。',
    keywords: ['跨性别', '社群', '自我关怀', '爱自己'],
  },
  '33571545': {
    seoDescription: '因为过早发育失去了身边所有人际关系，对自己很失望——一段关于身体与孤独的遗憾。',
    keywords: ['跨性别', '身体发育', '人际关系', '孤独'],
  },
  '34548305': {
    seoDescription: '在教室被多名男生当众脱裤羞辱，宿舍洗澡被闯入围观——一位跨性别者的校园霸凌创伤记录。',
    keywords: ['跨性别', '校园霸凌', '创伤', '性暴力'],
  },
  '35309757': {
    seoDescription: '在性别焦虑与自卑中，伴侣却坚定表白：你本来就是可爱的女孩子，我等你成为自己梦想的样子。',
    keywords: ['跨性别', '爱情', '伴侣支持', '接纳'],
  },
  '35611285': {
    seoDescription: '因发表言论被拘留37天后取保候审，无亲无故全靠自己撑下来——一段关于毅力与孤独的自述。',
    keywords: ['跨性别', '逆境', '坚韧', '孤独'],
  },
  '35706964': {
    seoDescription: '我们不是病人，不需要偏见也不需要特殊照顾：忠于自己的平常人，不必隐藏，平等待人。',
    keywords: ['跨性别', '平等', '去污名化'],
  },
  '35982312': {
    seoDescription: '一则黑色幽默的提醒：谨慎和好兄弟交往，说不定哪天就被睡了。',
    keywords: ['跨性别', '交友', '幽默'],
  },
  '36056685': {
    seoDescription: '当暴力无处可逃，丧失理智的暴力也曾是唯一的出口——一段关于反抗与代价的沉重坦白。',
    keywords: ['跨性别', '暴力', '反抗'],
  },
  '36486719': {
    seoDescription: '想变成真正的自己、成为一个女孩子——这是一生的梦想。',
    keywords: ['跨性别', '梦想', '自我认同'],
  },
  '38411178': {
    seoDescription: '好想我前男友——一句简单而真挚的想念。',
    keywords: ['跨性别', '想念', '感情'],
  },
  '38697568': {
    seoDescription: '我们的存在，就是对恶意最大的反抗——跨性别社群的宣言。',
    keywords: ['跨性别', '存在', '反抗'],
  },
  '40143115': {
    seoDescription: '以温柔求温柔则温柔亡，以和平求和平则和平亡——对以退让换取接纳的清醒反思。',
    keywords: ['跨性别', '抗争', '反思'],
  },
  '40859073': {
    seoDescription: '希望中国的新一代父母对跨性别孩子多一些理解而非传统观念，愿大家都能好好做真正的自己。',
    keywords: ['跨性别', '家庭理解', '父母', '希望'],
  },
  '41648167': {
    seoDescription: '我现在有点饿，想吃薯片——跨性别生活中一个轻松可爱的小瞬间。',
    keywords: ['跨性别', '日常', '轻松'],
  },
  '41946238': {
    seoDescription: '一直有性别认同困扰，却因恐惧改变、深信无法真正成为另一个性别，从未开始激素治疗，被迫以被规训的身份生活。',
    keywords: ['跨性别', '性别认同', '恐惧', 'HRT'],
  },
  '42358103': {
    seoDescription: '与父亲的关系复杂：物质上无可挑剔，精神上却匮乏，偶尔还有打骂，也曾动过手。',
    keywords: ['跨性别', '家庭关系', '亲子冲突'],
  },
  '43175216': {
    seoDescription: '家长翻书包发现激素药物后辱骂殴打、想送去做扭转治疗，甚至威胁打断腿——一段充满冲突的跨性别就医与家庭经历。',
    keywords: ['跨性别', 'HRT', '家庭冲突', '扭转治疗'],
  },
  '44001461': {
    seoDescription: '从小学剪短发被认作男生也不解释，到青春期因第二性征发育而焦虑——一段漫长的性别自我觉察。',
    keywords: ['跨性别', '性别认同', '青春期', '自我觉察'],
  },
  '44772025': {
    seoDescription: '曾经因政治立场反跨，从没察觉自己的跨性别倾向；当思想放开，才发现自己也是其中一员，并终于接纳自己。',
    keywords: ['跨性别', '自我接纳', '思想转变'],
  },
  '45648863': {
    seoDescription: '一只猫的1岁生日纪念：从幼儿园偷穿裙子，到偶然遇见“女装大佬吧”，再到第一颗补佳乐与雌二醇凝胶——写给自己的跨性别元年。',
    keywords: ['跨性别', 'MTF', '激素治疗', '生日纪念', '自我成长'],
  },
  '47398867': {
    seoDescription: '希望这个世界能多一份理解、少一份歧视——最简单的祝愿，也是最深的渴望。',
    keywords: ['跨性别', '理解', '反歧视'],
  },
  '48091596': {
    seoDescription: '给辛苦的跨性别小女孩的晚安语：铺好云朵奶冻被窝，好好休息，扫去疲惫，做个甜甜的梦。',
    keywords: ['跨性别', '自我关怀', '晚安', '温柔'],
  },
  '50242142': {
    seoDescription: '生命是这个世界上最珍贵的东西——即使现在不美好也不要轻易放弃，总有人关心你，总有人会因你消失而悲伤。',
    keywords: ['跨性别', '生命', '心理支持', '好好活着'],
  },
  '50415783': {
    seoDescription: '把自己的真实经历写给了别人并发布在B站（视频号cv42557764）——一段关于某机构的经历分享。',
    keywords: ['跨性别', '经历分享', 'B站'],
  },
  '50921359': {
    seoDescription: '11岁遭遇侵犯、家中破产、人格解离……一位跨性别者伤痕累累的成长史与求生记录。',
    keywords: ['跨性别', '创伤', '心理健康', '求生'],
  },
  '53783906': {
    seoDescription: '从名牌高中辍学前写出柜信被同学羞辱，到大专复学体考名单上被要求自己写下性别——校园里的两次创伤。',
    keywords: ['跨性别', '出柜', '校园羞辱', '创伤'],
  },
  '54273093': {
    seoDescription: '面对“你完全就是男人！”的恶意，只回一句“啊，好的。”——用平静承接恶意的瞬间。',
    keywords: ['跨性别', '恶意', '应对', '心理韧性'],
  },
  '54545353': {
    seoDescription: '伴侣帮我挑选衣服搭配，很幸福；希望跨性别议题可以非政治化，不被利用而变质。',
    keywords: ['跨性别', '爱情', '去政治化', '幸福'],
  },
  '55316652': {
    seoDescription: '一位跨性别者对社会环境与未成年人问题的隐晦观察：价值观未定型的年轻人容易被影响，之后便不可控了。',
    keywords: ['跨性别', '未成年人', '社会观察'],
  },
  '55399086': {
    seoDescription: '曾连续遭遇四个重大打击、多次自伤甚至濒死，如今情况逐渐稳定——一段走出至暗时刻的记录。',
    keywords: ['跨性别', '自伤', '康复', '心理健康'],
  },
  '55610441': {
    seoDescription: '初中时遇到一个与自己别无二致的同类，却因转学分道扬镳，再也没有见过——一段错过的相识。',
    keywords: ['跨性别', '相识', '错过', '校园'],
  },
  '55641646': {
    seoDescription: '我们都有花期，或早或晚，只要呵护终究会绽放。出柜十年、抑郁休学之后，终于等到新生焕发。',
    keywords: ['跨性别', '出柜', '自我接纳', '新生'],
  },
  '56174530': {
    seoDescription: '留长发、中性长相被家人察觉，母亲却温柔回应：“你是妈妈的心头肉，就算想变性我也支持你。”',
    keywords: ['跨性别', '家人支持', '出柜', '感动'],
  },
  '56716104': {
    seoDescription: '给朋友（mzk）的可爱告白：你是一只可爱的粉色大猫——社群里的轻松日常。',
    keywords: ['跨性别', '朋友', '可爱日常'],
  },
  '56908870': {
    seoDescription: '骄傲月就要为勇敢的自己骄傲：就算抽到烂牌也要尽量打好，姐妹们加油。',
    keywords: ['跨性别', '骄傲月', '鼓励', '社群'],
  },
  '57592755': {
    seoDescription: '这个世界不对——一句对不公环境的简短控诉。',
    keywords: ['跨性别', '社会不公', '控诉'],
  },
  '57765649': {
    seoDescription: '似乎有想说的，却不知道怎么说，又太长，懒得说——久而久之，表达欲就消失了。',
    keywords: ['跨性别', '表达', '孤独', '失语'],
  },
  '58850241': {
    seoDescription: '情况最近在好转，好几次被夸可爱，也有很多朋友愿意带着我——一段慢慢变好的记录。',
    keywords: ['跨性别', '好转', '朋友', '被认可'],
  },
  '59440074': {
    seoDescription: '希望这个世界和社会能给我们更多的理解与包容——一个跨性别者的朴素愿望。',
    keywords: ['跨性别', '理解', '包容'],
  },
  '59535908': {
    seoDescription: '讨厌世界的不公平，也讨厌对别人无缘无故抱有恶意的人——一段直率的情绪表达。',
    keywords: ['跨性别', '不公平', '恶意', '情绪'],
  },
  '64293496': {
    seoDescription: '从小想做女生却总被自己搪塞：读《红楼梦》、被女友一句“变性的三十多岁就死了”劝退，蹉跎到18岁才真正了解LGBT。',
    keywords: ['跨性别', '自我探索', '性别认同', '觉醒'],
  },
  '65727428': {
    seoDescription: '环境会越来越艰难，但请加油跑出去——给同类的现实提醒与鼓励。',
    keywords: ['跨性别', '生存', '鼓励', '离开'],
  },
  '66109016': {
    seoDescription: '看着母亲的工作看到成年后的疲惫：按固定剧本娶妻生子、干到退休，像老人们一样无趣地老去。',
    keywords: ['跨性别', '人生焦虑', '传统剧本', '生活'],
  },
  '66428300': {
    seoDescription: '来到这个世界，是天意，还是乌龙？——对自我存在的一声哲学式自问。',
    keywords: ['跨性别', '存在', '自问'],
  },
  '68482833': {
    seoDescription: '一段隐去关键信息的人生回溯：十余年的纠缠，最终欣慰于那个找回所有自我的自己。',
    keywords: ['跨性别', '自我找回', '成长'],
  },
  '69867217': {
    seoDescription: '长辈虽不理解跨性别，但一直努力尊重、尝试把我当作心理性别来对待——感谢这份笨拙的爱。',
    keywords: ['跨性别', '家人尊重', '感谢'],
  },
  '70593139': {
    seoDescription: '我爱寒涟漪——一句直接而热烈的表白。',
    keywords: ['跨性别', '表白', '感情'],
  },
  '70844034': {
    seoDescription: '我爱我的男朋友！也希望各位跨性别朋友都能心想事成，完成自己的梦想。',
    keywords: ['跨性别', '爱情', '祝福'],
  },
  '72345222': {
    seoDescription: '朴树《平凡之路》的歌词：跨过山和大海，穿过人山人海，直到看见平凡才是唯一的答案。',
    keywords: ['跨性别', '平凡之路', '歌词', '人生'],
  },
  '72410973': {
    seoDescription: '只想做、也喜欢做一个普通的非二元者，希望所有人都能做自己。',
    keywords: ['非二元', 'enby', '做自己'],
  },
  '72802446': {
    seoDescription: '“没有一个人必须为自己的认同道歉”——一句关于性别认同尊严的引语。',
    keywords: ['跨性别', '性别认同', '尊严', '不必道歉'],
  },
  '75283979': {
    seoDescription: '宁可深柜，也不要向任何人透露、炸柜——一段关于隐藏与安全的无奈抉择。',
    keywords: ['跨性别', '深柜', '隐藏', '安全'],
  },
  '76487328': {
    seoDescription: '一段极致浪漫又深陷悲观的独白：不愿辗转成草木鸟兽，若世间容不下这念想，便赐我无声的消散。',
    keywords: ['跨性别', '悲观', '浪漫', '孤独'],
  },
  '77811174': {
    seoDescription: '爱你——两个字，最简单的告白。',
    keywords: ['跨性别', '告白'],
  },
  '77875857': {
    seoDescription: '用《士兵突击》的台词共勉：“好好活就是有意义，有意义就是好好活”——也是正在写作的文本的重要线索。',
    keywords: ['跨性别', '生命意义', '士兵突击'],
  },
  '78483768': {
    seoDescription: '16岁出柜独自生活，经历很多；如今20岁自由职业月入4-6k，外表认可度高，与指派性别女性没有明显区别。',
    keywords: ['跨性别', '独立生活', '自由职业', '生存'],
  },
  '78940430': {
    seoDescription: '以前的你，在努力成为“自己”；现在的你，开始思考怎样以“自己”的身份，把后半生过好。',
    keywords: ['跨性别', '成长', '后半生', '自我'],
  },
  '79489960': {
    seoDescription: '感谢寒涟漪姐姐：是她为作者接触MTF群体和激素药物提供了最初的支持与引路。',
    keywords: ['跨性别', 'MTF', 'HRT', '感谢', '互助'],
  },
  '79717410': {
    seoDescription: '渴望有人知道：爱像生与死一样凶猛——一句关于爱的英文独白。',
    keywords: ['跨性别', '爱', '独白'],
  },
  '80041004': {
    seoDescription: '对问卷调查形式的观察：某类机构形式毕竟不是本土产物，很多人填写时可能会有困扰。',
    keywords: ['跨性别', '调查', '本土化'],
  },
  '80737619': {
    seoDescription: '我们的存在，就是对恶意最大的反抗——De404。',
    keywords: ['跨性别', '存在', '反抗'],
  },
  '81126703': {
    seoDescription: '刚成年就自己把名字改成了女性化版本，感觉重获新生，更有自信了。',
    keywords: ['跨性别', '改名', '新生', '自信'],
  },
  '83112997': {
    seoDescription: '努力做自己！但愿你真的清楚，这是你自己——肥鹅瑶瑶的提醒。',
    keywords: ['跨性别', '做自己', '自我认知'],
  },
  '83802008': {
    seoDescription: '希望我们大家可以不再离开——对失去同类的痛惜与祈愿。',
    keywords: ['跨性别', '离别', '祈愿', '社群'],
  },
  '84093490': {
    seoDescription: '给跨性别同类的真诚建议：保持自我主体意志的坚韧，经济独立、有抗压能力后再选择公开；不要过量服药、不要自伤。',
    keywords: ['跨性别', '生存建议', '自我关怀', '安全'],
  },
  '84305393': {
    seoDescription: '为世界上所有的美好而战！第一次测激素六项，被温柔的姐姐送了小手串当护身符——线下互助的温暖。',
    keywords: ['跨性别', '激素检查', '互助', '温暖'],
  },
  '84554452': {
    seoDescription: '母亲曾带作者找“大仙”驱邪，反而是“医托”让她完成了精神检查——一段荒诞又幸运的就医经历。',
    keywords: ['跨性别', '就医经历', '家庭', '精神检查'],
  },
  '86000382': {
    seoDescription: '希望世界更包容，也希望正经历性别焦虑的朋友们早日找到内心的自己，天天开心。',
    keywords: ['跨性别', '性别焦虑', '包容', '祝福'],
  },
  '86903651': {
    seoDescription: '几年前觉得撑不到明天，后来慢慢调整心态熬了过来：任何努力都会得到回报，坚持下去就一定会看到曙光。',
    keywords: ['跨性别', '抑郁', '坚持', '曙光'],
  },
  '88151880': {
    seoDescription: 'FTM跨性别者的成长史：从小性格男性化、初中觉醒、重度抑郁后考上985走出阴影，也反思中外跨性别处境的差异。',
    keywords: ['跨性别', 'FTM', '抑郁', '985', '中外对比'],
  },
  '88256438': {
    seoDescription: '性别不是非男即女两种——世界上天然存在性别分化不属于任何一类的人。我们是第三性，需要团结争取赋能机会。',
    keywords: ['跨性别', '第三性', '性别多元', '性别平等'],
  },
  '89669315': {
    seoDescription: '我不会伤害除了自己以外的任何一个人——希望其他“药娘”（使用激素的跨性别女性）都幸福一点。',
    keywords: ['跨性别', '药娘', '自我关怀', '祝福'],
  },
  '91227189': {
    seoDescription: '哪怕在一线城市，不和谐的家庭也会影响孩子一生：读书、求职、整个人都懒了下来，只希望能有个好日子、开开心心做自己。',
    keywords: ['跨性别', '家庭', '影响', '希望'],
  },
  '92331844': {
    seoDescription: '只有对事实的美化才是真正的教唆和宣传：不表达情绪不会减少负面传染，反而会错失外界援助；做自己喜欢的才有意义。',
    keywords: ['跨性别', '情绪表达', '自我价值', '反思'],
  },
  '92336782': {
    seoDescription: '一位跨性别者的清醒观察：很多人如同跟风般加入群体令人反感，炫耀激素药物吸引心智未成熟者也并不妥当。',
    keywords: ['跨性别', '社群反思', 'HRT', '理性'],
  },
  '92374930': {
    seoDescription: '我真的好难受……好渴望变成女生或成为被尊重的跨性别者，好想哭，好想被爱。',
    keywords: ['跨性别', '渴望被爱', '情绪'],
  },
  '92571571': {
    seoDescription: '好累，好想睡觉，好想吃好吃的，好想变有钱，好想为所欲为——疲惫时的白日梦。',
    keywords: ['跨性别', '疲惫', '日常'],
  },
  '93405263': {
    seoDescription: '在学校披萨摊遇到至今最好的姐妹：她后来出柜是FTM非二元，愿作为大姐姐继续守护他。',
    keywords: ['跨性别', 'FTM', '非二元', '友谊'],
  },
  '93670610': {
    seoDescription: '私は私を生きる（我活出我自己）——一句日文的自我宣言。',
    keywords: ['跨性别', '自我', '日语'],
  },
  '95118512': {
    seoDescription: 'chenchen 在厦门大学找不到同类喵——在校跨性别者的孤独与求友。',
    keywords: ['跨性别', '大学生', '孤独', '求友'],
  },
  '95487679': {
    seoDescription: '小学时因性格接近女生被嘲笑，心里却隐隐觉得舒服——那时还不知道自己就是MTF。',
    keywords: ['跨性别', 'MTF', '自我觉察', '童年'],
  },
  '95514579': {
    seoDescription: '血债血偿，战天斗地，绝不屈服——一段充满决绝的宣言。',
    keywords: ['跨性别', '抗争', '决心'],
  },
  '95658751': {
    seoDescription: '从小就觉得自己与众不同：喜欢裙子和娃娃却必须强迫自己喜欢男生该喜欢的东西，如今终于释然，身体也在好转。',
    keywords: ['跨性别', '性别认同', '释然', '成长'],
  },
  '98811449': {
    seoDescription: '希望性别平等能早日实现，LGBTQ群体也能作为正常人生活。',
    keywords: ['跨性别', '性别平等', 'LGBTQ'],
  },
  '99305277': {
    seoDescription: '窥见那个自己，也许只能在梦中……一句关于未竟自我认同的怅惘。',
    keywords: ['跨性别', '自我', '怅惘'],
  },
  '99994835': {
    seoDescription: '即使是跨性别者，也不要给同类贴“跨”的标签——这和说人“女司机”有什么区别？',
    keywords: ['跨性别', '去标签化', '反思'],
  },

  // ---------- blog ----------
  '2026-transgender-survival-survey': {
    seoDescription: '一起完成《2026 中国跨性别者生存处境调查》：一份匿名问卷，记录中国跨性别与性别多元群体在医疗、家庭、教育、就业与心理健康等方面的真实处境。',
    keywords: ['2026中国跨性别者生存处境调查', '跨性别', '问卷调查', '生存现状'],
  },
  'becoming-a-cat-a-story-about-srs': {
    seoDescription: '查资料时被一篇“出发去泰国做变猫手术”的博客逗笑又打动：SRS 性别重置手术的另一种轻盈叙事，写给我们这些想成为自己模样的人。',
    keywords: ['SRS', '性别重置手术', '跨性别', '泰国'],
  },
  'china-mtf-survival-guide': {
    seoDescription: '写给中国 MTF（跨性别女性）的生存指南：从身份认同、激素治疗到医疗资源与安全防护，一份在国际不再恐同日送上的互助手册。',
    keywords: ['MTF生存指南', '跨性别女性', '激素治疗', '互助手册'],
  },
  'illustrated-hardcover-notebook-with-ribbon': {
    seoDescription: '我们天生就被赋予了细腻的底色：偏爱柔软的色彩、不自觉地放轻脚步、有着仿佛溢出来的同情心——写给被比喻为“精装本”的性别多元者。',
    keywords: ['跨性别', '性别多元', '自我认同', '温柔'],
  },
  'ios-26-5-pride-wallpapers': {
    seoDescription: '苹果发布全新 Pride 表带、表盘与壁纸：Pride Luminance 的动态折射色彩，让用户展现自我与社群的独特个性，庆祝骄傲月与 LGBTQ+ 团结。',
    keywords: ['苹果', '骄傲月', 'Pride', 'LGBTQ+', '壁纸'],
  },

  // ---------- report ----------
  'china-transgender-healthcare-assessment-report': {
    seoDescription: '评估中国跨性别医疗制度：以“病理化”认定为基的现行制度设置大量程序与社会性门槛，使跨性别者在获得性别肯定医疗与法律性别承认时面临严重障碍。',
    keywords: ['跨性别医疗', '性别肯定医疗', '医疗制度评估', '病理化'],
  },
  'kiraequal-china-transgender-status-report': {
    seoDescription: '基于2019-2025年多项定量调研与定性访谈，系统审视中国跨性别群体生存现状：医疗、家庭、教育与就业领域的系统性壁垒与群体的隐秘脆弱。',
    keywords: ['中国跨性别', '生存现状报告', '跨性别调研', '系统性壁垒'],
  },
  'un-free-and-equal-transgender-status-and-challenges': {
    seoDescription: '什么是跨性别？什么是性别认同与性别表达？一篇面向公众的跨性别基础科普：解释性别认同、转换途径与跨性别人群享有的人身权利。',
    keywords: ['跨性别科普', '性别认同', '性别表达', '人权'],
  },
}

function yamlSingleQuote(value) {
  return `'${value.replace(/'/g, "''")}'`
}

const apply = process.argv.includes('--apply')
const compiledPath = path.join(root, 'src', 'data', 'compiled_articles.json')
const compiledBySlug = new Map(
  JSON.parse(readFileSync(compiledPath, 'utf8')).map((item) => [`${item.type}:${item.slug}`, item]),
)
let updated = 0
let skipped = 0
const problems = []

for (const dir of ['stories', 'blog', 'report']) {
  const dirPath = path.join(root, 'content', dir)
  let names = []
  try {
    names = readdirSync(dirPath).filter((n) => n.endsWith('.md')).sort()
  } catch {
    continue
  }
  for (const name of names) {
    const key = name.replace(/\.md$/, '')
    const entry = SEO[key]
    if (!entry) {
      problems.push(`no SEO entry for ${dir}/${name}`)
      continue
    }
    const filePath = path.join(dirPath, name)
    const raw = readFileSync(filePath, 'utf8')
    const nl = raw.includes('\r\n') ? '\r\n' : '\n'
    const seoLines = [
      `seoDescription: ${yamlSingleQuote(entry.seoDescription)}`,
      `keywords: [${entry.keywords.join(', ')}]`,
    ]
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
    let next
    if (match) {
      const frontMatter = match[1]
      next = `---${nl}${frontMatter}${nl}${seoLines.join(nl)}${nl}---${nl}${raw.slice(match[0].length)}`
    } else if (dir === 'stories' && key === '45648863') {
      next = [
        `---${nl}slug: "${key}"${nl}title: 一只猫的1岁生日${nl}type: stories${nl}year: "2026.06.29"`,
        ...seoLines,
        `---${nl}${nl}`,
      ].join(nl) + raw
    } else if (dir === 'blog' || dir === 'report') {
      // These sources are bare markdown; rebuild a full frontmatter from the
      // previously compiled metadata so no title/date/cover/description is lost.
      const previous = compiledBySlug.get(`${dir}:${key}`)
      if (!previous) {
        problems.push(`no compiled metadata for ${dir}/${name}`)
        continue
      }
      const fm = [
        `title: ${yamlSingleQuote(previous.title ?? key)}`,
        `slug: "${key}"`,
        `cover: ${yamlSingleQuote(previous.cover_name ?? '')}`,
        `type: ${dir}`,
        `date: "${previous.date ?? ''}"`,
        ...(previous.desc ? [`description: ${yamlSingleQuote(previous.desc)}`] : []),
        ...seoLines,
      ].join(nl)
      next = `---${nl}${fm}${nl}---${nl}${nl}${raw}`
    } else {
      problems.push(`no frontmatter to patch for ${dir}/${name}`)
      continue
    }
    if (next === raw) {
      skipped += 1
      continue
    }
    if (apply) writeFileSync(filePath, next)
    updated += 1
    if (!apply) console.log(`[dry] ${dir}/${name}`)
  }
}

console.log(`\n${apply ? 'applied' : 'dry-run'}: ${updated} files would be updated, ${skipped} unchanged, ${problems.length} problems`)
if (problems.length) console.log(problems.join('\n'))
