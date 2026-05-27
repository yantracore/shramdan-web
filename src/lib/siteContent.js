export const copy = {
  np: {
    brand: "श्रमदान",
    nav: {
      home: "गृहपृष्ठ",
      issues: "समस्याहरू",
      join: "जोडिनुहोस्",
      feedback: "प्रतिक्रिया",
      login: "लगइन"
    },
    ariaLabels: {
      home: "श्रमदान गृहपृष्ठ",
      nav: "मुख्य नेभिगेसन",
      preferences: "वेबसाइट प्राथमिकताहरू",
      toggleTheme: "थिम बदल्नुहोस्",
      openMenu: "नेभिगेसन खोल्नुहोस्",
      heroPanel: "श्रमदान कार्य केन्द्र",
      userMenu: "प्रयोगकर्ता मेनु"
    },
    controls: {
      language: "English",
      languageTooltip: "Change to English language",
      themeTooltip: "थिम बदल्नुहोस्",
      darkTheme: "गाढा थिम",
      lightTheme: "उज्यालो थिम"
    },
    hero: {
      eyebrow: "",
      title: "श्रमदान",
      subtitle: "हाम्रो श्रम, हाम्रो समाज, हाम्रो भविष्य।",
      support: "देशका हरेक समस्या सरकारको प्रतीक्षा गरेर समाधान हुँदैन। हामी नागरिकहरू आफैं मिलेर सरसफाइ, मर्मत, वृक्षारोपण, टोल सुधार जस्ता आधारभूत काम अघि बढाउन सक्छौँ। श्रमदान त्यही सामूहिक जिम्मेवारीको सुरुवात हो। साना साना हातहरू मिलेर ठूला परिवर्तन सम्भव हुन्छ। आज हाम्रो श्रमदान, भोलि सुन्दर समाजको निर्माण।",
      join: "योगदान गर्नुहोस्"
    },
    heroPanel: {
      kicker: "एप बनाउन सहयोग गर्नुहोस्",
      title: "श्रमदान गरेर श्रमदान एप बनाऔँ",
      body:
        "श्रमदान अहिले एप निर्माणको चरणमा छ। आफ्नो समय, सीप, विचार र समन्वय दिएर मञ्च आफैं निर्माण गर्न योगदान गर्न सकिन्छ।",
      resourcesLabel: "श्रमदानका उपयोगी सामग्रीहरू",
      liveBadge: "लाइभ",
      liveAria: "अहिले प्रत्यक्ष",
      resources: [
        {
          id: "participate",
          title: "प्रत्यक्ष सहभागिता",
          label: "गुगल मीटमा १२ बजे, सोम–शुक्र"
        },
        {
          id: "watchLive",
          title: "प्रत्यक्ष प्रसारण",
          label: "युट्युबमा १२ बजे, सोम–शुक्र"
        },
        {
          id: "discord",
          title: "डिस्कोर्ड समुदाय",
          label: "कुराकानी, प्रश्न र समाचार"
        }
      ]
    },
    buildInPublic: {
      heroLabel: "एप निर्माण प्रगति",
      heroAria: "एप निर्माण समग्र प्रगति",
      roadmapCta: "विस्तृत रोडम्याप हेर्नुहोस्",
      roadmapHref: "https://github.com/yantracore/shramdan-web/blob/main/docs/00-master-roadmap.md",
      phaseLabel: "चरण",
      sectionEyebrow: "अहिले के भइरहेको छ",
      sectionTitle: "श्रमदान एपमा हालैको प्रगति",
      sectionIntro:
        "हाम्रो दैनिक १२ बजेको लाइभ स्ट्रिममा सक्रिय रहेका कामहरू, अब आउने सुविधाहरू र भर्खर तयार भएका सुविधाहरू। यो सूची रोडम्यापबाटै सिधै आउँछ - काम अघि बढ्दै जाँदा यहीँ आफै अपडेट हुन्छ।",
      statusActive: "अहिले बनाइँदै",
      statusUpcoming: "अबको पालो",
      statusShipped: "भर्खर तयार",
      relativeToday: "आज तयार",
      relativeYesterday: "हिजो तयार",
      relativeDaysAgo: "{n} दिनअघि तयार",
      relativeUpcoming: "लाइनमा",
      fallbackBlurb: "रोडम्यापको यो खण्डमा सक्रिय काम; पूर्ण विवरण रोडम्यापमा हेर्नुहोस्।",
      fullRoadmapCta: "रोडम्याप पढ्नुहोस्",
      taskOverrides: {
        "1.5.1": {
          title: "इश्युमा भोट हाल्ने सुविधा",
          blurb:
            "लगइन गरेका सदस्यले समस्यालाई एक क्लिकमा समर्थन गर्न पाउँछन्। भोट फिर्ता लिने विकल्प पनि चाँडै आउँदै।",
          iconKey: "vote"
        },
        "1.5.3": {
          title: "भोट दिँदा आफ्नो भूमिका छनोट",
          blurb: "स्वयंसेवक, दाता, चासो राख्ने - कुन रूपमा समर्थन गर्ने भनी छनोट गर्ने सुविधा।",
          iconKey: "auth"
        },
        "14.1": {
          title: "लाइभ निर्माण प्रगति होमपेजमै",
          blurb:
            "तपाईंले अहिले हेरिरहनुभएको यो खण्ड - रोडम्यापबाटै सिधै आउँछ, हाम्रो दैनिक कामसँगै अपडेट हुन्छ।",
          iconKey: "roadmap"
        },
        "1.5.2": {
          title: "भोटमा तत्काल प्रतिक्रिया",
          blurb: "क्लिक गर्नासाथ गणना बढ्ने, लगइन नभए सिधै लगइन पृष्ठमा लैजाने।",
          iconKey: "vote"
        },
        "1.4": {
          title: "इश्यु शेयरिङ + लिङ्क प्रिभ्यु",
          blurb:
            "Facebook, X (Twitter), WhatsApp र Telegram मा शेयर गर्न मिल्ने, साथमा सुन्दर लिङ्क प्रिभ्यु पनि।",
          iconKey: "share"
        },
        "1.2": {
          title: "इश्यु विस्तृत पृष्ठ",
          blurb: "हरेक समस्याको पूर्ण विवरण, स्थान, साक्षी फोटो र समर्थक संख्या एकै ठाउँमा।",
          iconKey: "page"
        },
        "1.1": {
          title: "सार्वजनिक इश्यु सूची",
          blurb:
            "सबैले हेर्न मिल्ने समस्याहरूको सूची - स्थिति, श्रेणी र भोटका आधारमा फिल्टर तथा क्रमबद्ध गर्न मिल्ने।",
          iconKey: "list"
        },
        "0.3": {
          title: "होमपेज + परिचय",
          blurb:
            "श्रमदानको अभियान, सहभागिताका तरिकाहरू र स्वयंसेवक भूमिकाहरू एकै पृष्ठमा। यो नै तपाईंको प्रवेश-द्वार हो।",
          iconKey: "home"
        },
        "0.5": {
          title: "लगइन + व्यवस्थापन शेल",
          blurb: "टोकनमा आधारित लगइन र भूमिका-आधारित admin control center भित्र पहुँच।",
          iconKey: "auth"
        },
        "0.7": {
          title: "नेपाली + English द्विभाषिक कभरेज",
          blurb: "सम्पूर्ण सार्वजनिक पृष्ठहरू दुवै भाषामा - माथिको भाषा बटनबाट तुरुन्तै बदल्न मिल्ने।",
          iconKey: "translate"
        },
        "3.2": {
          title: "अभियानको सार्वजनिक पृष्ठ",
          blurb: "प्रत्येक सफाइ अभियानको मिति, स्थान, लक्ष्य र चाहिने सहयोग एकै ठाउँमा।",
          iconKey: "campaign"
        },
        "2.1": {
          title: "फोन + OTP बाट सदस्यता",
          blurb: "इमेल नचाहिने, फोन नम्बरबाटै सदस्य बन्न मिल्ने - मोबाइलमा सजिलो।",
          iconKey: "mobile"
        },
        "13.2": {
          title: "सामुदायिक प्रभाव रिपोर्ट",
          blurb: "कति इश्यु, कति अभियान, कति स्वयंसेवक - सबैले हेर्न मिल्ने सार्वजनिक तथ्याङ्क।",
          iconKey: "report"
        },
        "14.2": {
          title: "समर्पित निर्माण प्रगति पृष्ठ",
          blurb: "रोडम्यापको पूरा विवरण - कुन चरण कति प्रतिशत सकियो, कुन कुरा अहिले बनाइँदै।",
          iconKey: "roadmap"
        },
        "14.3": {
          title: "सार्वजनिक भोटिङ (Polls)",
          blurb: "कुन फिचर पहिले बनाउने भन्ने निर्णय समुदायले गर्ने - भोट गरेर रोडम्याप आकार दिनुहोस्।",
          iconKey: "vote"
        }
      }
    },
    cleanupAreas: {
      eyebrow: "के सफा गर्ने?",
      title: "सुरुवातका सफाइ क्षेत्रहरू",
      intro:
        "श्रमदान पहिलो चरणमा आँखाले देखिने, सबैले महसुस गर्ने र समुदायले तुरुन्तै हात हाल्न सक्ने ठाउँबाट सुरु हुन्छ - एक पटकमा एक ठाउँ।",
      items: [
        {
          id: "roadside",
          image: "/images/homepage/cleanup-areas/roadside.png",
          imageAlt: "सडक किनार सफाइमा सहभागी स्वयंसेवकहरू",
          title: "सडक र फुटपाथ",
          body: "मुख्य सडक, गल्ली, फुटपाथ र सडकछेउमा देखिने फोहोर सफा गर्ने।"
        },
        {
          id: "lands",
          image: "/images/homepage/cleanup-areas/empty-lands.png",
          imageAlt: "खाली जमिनमा फोहोर संकलन गर्दै स्वयंसेवकहरू",
          title: "खाली जग्गा",
          body: "बाँझो जमिन, खुला प्लट र बेवास्ता गरिएका ठाउँलाई सफा र सुरक्षित बनाउने।"
        },
        {
          id: "riverbanks",
          image: "/images/homepage/cleanup-areas/riverbanks.png",
          imageAlt: "नदी किनारमा सफाइ अभियान",
          title: "नदी किनार र जलमार्ग",
          body: "नदी, खोला, ताल र पानी बग्ने क्षेत्रमा जम्मा भएको फोहोर हटाउने।"
        },
        {
          id: "drains",
          image: "/images/homepage/cleanup-areas/drains.png",
          imageAlt: "ढल र नाला सफाइ गर्दै टोली",
          title: "ढल र नाला",
          body: "पानी जम्ने ठाउँ, नाली र गल्लीका निकासहरू सफा राख्ने।"
        },
        {
          id: "parks",
          image: "/images/homepage/cleanup-areas/parks.png",
          imageAlt: "पार्क र सार्वजनिक ठाउँ सफाइ",
          title: "पार्क र सार्वजनिक ठाउँ",
          body: "पार्क, चौक, बस स्टप, सामुदायिक क्षेत्र र भेटघाट हुने ठाउँ सफा गर्ने।"
        },
        {
          id: "trails",
          image: "/images/homepage/cleanup-areas/nature-trails.png",
          imageAlt: "प्रकृति मार्गमा सफाइ गर्दै समूह",
          title: "हाइकिङ ट्रेल र प्रकृति मार्ग",
          body: "जंगल बाटो, दृश्यावलोकन स्थल, ट्रेल र प्रकृति मार्गलाई फोहोरमुक्त बनाउने।"
        }
      ]
    },
    coreIdea: {
      eyebrow: "मुख्य विचार",
      title:
        "श्रमदान एपले स्थानीय समस्यालाई सूचना, मतदान र श्रम योगदानमार्फत सामुदायिक कार्यक्रममा बदल्छ।",
      phaseNote: "पहिलो चरणमा हामी सामुदायिक सरसफाइबाट मात्र सुरु गर्छौं।",
      steps: [
        {
          id: "listing",
          image: "/images/homepage/core-idea/listing.png",
          imageAlt: "समस्या सूचीकृत गर्ने चरणको दृश्य",
          title: "सूचना",
          body: "सदस्यहरूले स्थान र तस्वीरसहित स्थानीय समस्या पठाउँछन्।"
        },
        {
          id: "vote",
          image: "/images/homepage/core-idea/vote.png",
          imageAlt: "मतदान चरणको दृश्य",
          title: "मतदान",
          body: "सदस्यहरूले महत्त्वपूर्ण समस्यालाई प्राथमिकता दिन मतदान गर्छन्।"
        },
        {
          id: "plan",
          image: "/images/homepage/core-idea/plan.png",
          imageAlt: "योजना बनाउने चरणको दृश्य",
          title: "योजना",
          body: "सबैभन्दा आवश्यक समस्या छानिन्छन् र सहभागीहरूलाई सूचना पठाइन्छ।"
        },
        {
          id: "event",
          image: "/images/homepage/core-idea/events.png",
          imageAlt: "सरसफाइ कार्यक्रम चरणको दृश्य",
          title: "कार्यक्रम",
          body: "सरसफाइ कार्यक्रम आयोजना, सम्पन्न र अभिलेख गरिन्छ।"
        },
        {
          id: "results",
          image: "/images/homepage/core-idea/results.png",
          imageAlt: "परिणाम सार्वजनिक गर्ने चरणको दृश्य",
          title: "परिणाम",
          body: "परिणाम श्रमदान एपमा सार्वजनिक रूपमा देखाइन्छ।"
        }
      ]
    },
    volunteerInvite: {
      brandLine: "आफ्नो श्रम दिनुहोस्। आफ्नो समुदाय बनाउनुहोस्।",
      eyebrow: "स्वयंसेवक निम्तो",
      titleLead: "हामी सबै मिली",
      titleStrong: "श्रमदान गरौँ",
      titleTrail: "आफ्नो देशका लागि",
      intro:
        "यो समुदायबाट चल्ने मञ्च सबैका लागि खुला छ। आफ्नो सीप, समय वा सम्पर्क प्रयोग गरेर टोली बनाउनुहोस्, भूमिका लिनुहोस्, र स्थानीय परिवर्तन सुरु गर्नुहोस्।",
      primaryCta: "स्वयंसेवक बन्नुहोस्",
      secondaryCta: "सुझाव दिनुहोस्",
      panelEyebrow: "हामीलाई तपाईं चाहिन्छ",
      panelTitle: "कुनै पनि भूमिका लिनुहोस् र एप विकासमा श्रमदान गर्नुहोस्।",
      panelIntro:
        "प्रविधि, डिजाइन, कानुन, वित्त, सहयोग वा स्थानीय नेतृत्व - श्रमदानमा योगदान गर्ने बाटो सबैका लागि छ।",
      cardCta: "योगदान दिनुहोस्",
      goal: {
        title: "हाम्रो लक्ष्य: समुदायले नेतृत्व गर्ने",
        body:
          "हामी यस्तो आधार बनाउँदैछौं जहाँ समुदायले कार्यक्रम चलाउन, निर्णय लिन र परिणामको जिम्मेवारी लिन सकून्।"
      },
      roles: [
        {
          id: "frontend",
          value: "FRONTEND_DEVELOPER",
          title: "फ्रन्टएन्ड डेभलपर",
          badge: "१ स्वयंसेवक",
          description: "वेब पृष्ठ, अन्तरक्रिया र प्रयोगकर्ता अनुभव बनाउन साथ दिनुहोस्।"
        },
        {
          id: "backend",
          value: "BACKEND_DEVELOPER",
          title: "ब्याकएन्ड डेभलपर",
          badge: "१ स्वयंसेवक",
          description: "सुरक्षित सेवा, तथ्याङ्क भण्डारण र प्रणाली संरचनामा योगदान गर्नुहोस्।"
        },
        {
          id: "qa",
          value: "QA_ENGINEER",
          title: "गुणस्तर परीक्षक (QA)",
          badge: "१ स्वयंसेवक",
          description: "एप परीक्षण, बग पहिचान र रिलिजअघि गुणस्तर सुनिश्चित गर्नुहोस्।"
        },
        {
          id: "devops",
          value: "DEVOPS_ENGINEER",
          title: "डेभअप्स इन्जिनियर",
          badge: "१ स्वयंसेवक",
          description: "सर्भर, CI/CD, deployment र निगरानी प्रणाली सञ्चालन गर्नुहोस्।"
        },
        {
          id: "uiux",
          value: "UI_UX_DESIGNER",
          title: "यूआई/यूएक्स डिजाइनर",
          badge: "१ स्वयंसेवक",
          description: "प्रयोगकर्ता अनुभव, रूपरेखा र डिजाइन प्रणाली सुधार्नुहोस्।"
        },
        {
          id: "graphics",
          value: "GRAPHICS_DESIGNER",
          title: "ग्राफिक्स डिजाइनर",
          badge: "१ स्वयंसेवक",
          description: "पहिचान, दृश्य सामग्री, चित्रण र अभियान सामग्री बनाउनुहोस्।"
        },
        {
          id: "content",
          value: "CONTENT_WRITER",
          title: "कन्टेन्ट लेखक",
          badge: "१ स्वयंसेवक",
          description: "लेख, कथा र समुदायिक सामग्री दुवै भाषामा तयार गर्नुहोस्।"
        },
        {
          id: "legal",
          value: "LEGAL",
          title: "कानुनी सल्लाहकार",
          badge: "१ स्वयंसेवक",
          description: "कानुनी मार्गदर्शन, संस्था निर्माण र नियमपालनमा बाटो देखाउनुहोस्।"
        },
        {
          id: "finance",
          value: "FINANCE",
          title: "वित्तीय सल्लाहकार",
          badge: "१ स्वयंसेवक",
          description: "वित्तीय योजना, पारदर्शिता र रणनीतिमा सहयोग गर्नुहोस्।"
        },
        {
          id: "donors",
          value: "DONOR",
          title: "आर्थिक सहयोगदाता",
          badge: "हरेक योगदान महत्त्वपूर्ण",
          description: "आर्थिक सहयोगमार्फत वास्तविक सामुदायिक परिवर्तन सम्भव बनाउनुहोस्।"
        },
        {
          id: "leaders",
          value: "COMMUNITY_MANAGER",
          title: "सामुदायिक नेतृत्वकर्ता",
          badge: "स्थानीय परिवर्तनका अगुवा",
          description: "आफ्नो ठाउँमा कार्यक्रम मिलाउनुहोस् र मानिसहरू जोड्नुहोस्।"
        }
      ]
    },
    resources: {
      eyebrow: "खुला स्रोतहरू",
      title: "खुला विकास सामग्री",
      intro: "श्रमदानको उद्देश्य, विकास यात्रा, कागजात र स्रोत कोड सबै सार्वजनिक छन्। हेर्नुहोस्, सिक्नुहोस्, समीक्षा गर्नुहोस्, र चाहिँदा योगदान पठाउनुहोस्।",
      playlist: {
        title: "श्रमदान विकास भिडियो शृङ्खला",
        description: "श्रमदानको विकास यात्रा, प्रत्यक्ष प्रसारण र परियोजनाको सन्दर्भ यहीँबाट सिधै हेर्न सकिन्छ।",
        embedUrl: "https://www.youtube-nocookie.com/embed/videoseries?list=PLWkh0s4xHPcTF4FOcYjkdR3i97YbkSDGo",
        playlistUrl: "https://www.youtube.com/playlist?list=PLWkh0s4xHPcTF4FOcYjkdR3i97YbkSDGo",
        button: "युट्युबमा पूरै प्लेलिस्ट हेर्नुहोस्"
      },
      items: [
        {
          id: "participate",
          title: "प्रत्यक्ष सहभागिता",
          description: "गुगल मीट मार्फत दैनिक श्रमदान कार्य सत्रमा सामेल हुनुहोस् — सोमबारदेखि शुक्रबार दिनको १२ बजे।",
          button: "सहभागी हुनुहोस्",
          href: "https://meet.google.com/kwi-kqyi-iyf"
        },
        {
          id: "watchLive",
          title: "प्रत्यक्ष प्रसारण हेर्नुहोस्",
          description: "युट्युबमा दैनिक विकास प्रत्यक्ष प्रसारण — सोमबारदेखि शुक्रबार दिनको १२ बजे।",
          button: "प्रत्यक्ष हेर्नुहोस्",
          href: "https://www.youtube.com/@yantracore/streams"
        },
        {
          id: "discord",
          title: "डिस्कोर्ड समुदाय",
          description: "डिस्कोर्डमा सबैसँग कुराकानी गर्नुहोस्, प्रश्न सोध्नुहोस् र समाचार पाउनुहोस्।",
          button: "डिस्कोर्डमा सामेल हुनुहोस्",
          href: "https://discord.gg/Cd57PXxf"
        },
        {
          id: "presentation",
          title: "प्रत्यक्ष प्रसारण प्रस्तुति सामग्री",
          description: "श्रमदानको उद्देश्य र पूरा विकास यात्रालाई समेटिएको प्रस्तुति सामग्री।",
          button: "प्रस्तुति खोल्नुहोस्",
          href: "https://drive.google.com/drive/folders/19Iuu_W7GRhD9F6qph0A8drKJQlN2UbUy"
        },
        {
          id: "roadmap",
          title: "विकास योजना (रोडम्याप)",
          description: "श्रमदान एप निर्माणका चरण, कार्यसूची र प्रगति समेटिएको पूरै मास्टर रोडम्याप।",
          button: "रोडम्याप खोल्नुहोस्",
          href: "https://github.com/yantracore/shramdan-web/blob/main/docs/00-master-roadmap.md"
        },
        {
          id: "documents",
          title: "गिटहब कागजातहरू",
          description: "योजना, रूपरेखा, कार्यान्वयन, एपीआई सन्दर्भ र सुरक्षा/कार्यक्रम मोडेलका कागजातहरू स्रोत भण्डारमै राखिएका छन्।",
          button: "गिटहब कागजात खोल्नुहोस्",
          href: "https://github.com/yantracore/shramdan-web/tree/main/docs"
        },
        {
          id: "github",
          title: "गिटहब स्रोत भण्डार",
          description: "सार्वजनिक स्रोत कोड, समस्या सूची र योगदान इतिहास समेटिएको खुला स्रोत भण्डार।",
          button: "स्रोत कोड हेर्नुहोस्",
          href: "https://github.com/yantracore/shramdan-web"
        },
        {
          id: "apiDocs",
          title: "एपीआई कागजात",
          description: "सर्भर एपीआईका ठेगाना, अनुरोध ढाँचा र परीक्षण सन्दर्भहरू समेटिएको सार्वजनिक एपीआई कागजात।",
          button: "एपीआई कागजात खोल्नुहोस्",
          href: "https://backend.shramdan.org/api-docs/"
        }
      ]
    },
    join: {
      eyebrow: "समुदायमा सामेल हुनुहोस्",
      title: "योगदानकर्ता आवेदन",
      intro: "आफ्नो सीप, समय र ऊर्जा प्रयोग गरेर श्रमदान निर्माणमा साथ दिनुहोस्।",
      name: "पूरा नाम",
      email: "इमेल ठेगाना",
      phone: "फोन नम्बर",
      role: "भूमिका",
      portfolio: "Portfolio URL",
      resumeUrl: "Resume URL",
      experience: "तपाईंको अनुभव",
      motivation: "तपाईं श्रमदानमा किन योगदान गर्न चाहनुहुन्छ?",
      additionalInfo: "थप जानकारी",
      submit: "आवेदन पठाउनुहोस्"
    },
    feedback: {
      eyebrow: "हामीलाई तपाईंको प्रतिक्रिया चाहिन्छ",
      title: "प्रतिक्रिया फाराम",
      intro: "सुझाव, समस्या, प्रश्न र सामान्य प्रतिक्रिया सबैले श्रमदानको बाटो स्पष्ट बनाउँछन्।",
      name: "पूरा नाम",
      email: "इमेल ठेगाना",
      type: "प्रतिक्रियाको प्रकार",
      experienceRating: "अनुभवको मूल्याङ्कन",
      message: "तपाईंको प्रतिक्रिया",
      screenshot: "Screenshot URL",
      submit: "प्रतिक्रिया पठाउनुहोस्"
    },
    placeholders: {
      joinName: "e.g. Muna Gurung",
      name: "e.g. Muna Gurung",
      email: "e.g. muna@example.com",
      phone: "+9779800000000",
      role: "भूमिका छान्नुहोस्",
      portfolio: "https://example.com",
      resumeUrl: "https://example.com/resume.pdf",
      experience: "तपाईंको पृष्ठभूमि, अनुभव वा उपलब्धि लेख्नुहोस्...",
      motivation: "तपाईंको प्रेरणा लेख्नुहोस्...",
      additionalInfo: "उपलब्ध समय, रुचि वा अरू सन्देश लेख्नुहोस्...",
      feedbackType: "प्रकार छान्नुहोस्",
      feedback: "तपाईंको प्रतिक्रिया, सुझाव वा चिन्ता लेख्नुहोस्...",
      screenshot: "https://example.com/screenshot.png"
    },
    options: {
      applicationRoles: [
        { label: "फ्रन्टएन्ड डेभलपर", value: "FRONTEND_DEVELOPER" },
        { label: "ब्याकएन्ड डेभलपर", value: "BACKEND_DEVELOPER" },
        { label: "गुणस्तर परीक्षक (QA)", value: "QA_ENGINEER" },
        { label: "डेभअप्स इन्जिनियर", value: "DEVOPS_ENGINEER" },
        { label: "यूआई/यूएक्स डिजाइनर", value: "UI_UX_DESIGNER" },
        { label: "ग्राफिक्स डिजाइनर", value: "GRAPHICS_DESIGNER" },
        { label: "कन्टेन्ट लेखक", value: "CONTENT_WRITER" },
        { label: "कानुनी सल्लाहकार", value: "LEGAL" },
        { label: "वित्तीय सल्लाहकार", value: "FINANCE" },
        { label: "आर्थिक सहयोगदाता", value: "DONOR" },
        { label: "सामुदायिक नेतृत्वकर्ता", value: "COMMUNITY_MANAGER" },
        { label: "भोलन्टियर", value: "VOLUNTEER" },
        { label: "अदर", value: "OTHER" }
      ],
      feedbackTypes: [
        { label: "सुझाव", value: "SUGGESTION" },
        { label: "समस्या रिपोर्ट", value: "BUG_REPORT" },
        { label: "प्रश्न", value: "QUESTION" },
        { label: "सामान्य", value: "GENERAL" }
      ]
    },
    messages: {
      join: "योगदानकर्ता आवेदन API मा पठाइयो।",
      feedback: "प्रतिक्रिया API मा पठाइयो।",
      required: "यो विवरण आवश्यक छ।",
      email: "कृपया सही इमेल ठेगाना लेख्नुहोस्।",
      submitError: "पठाउन सकिएन। कृपया फेरि प्रयास गर्नुहोस्।"
    },
    me: {
      title: "मेरो प्रोफाइल",
      intro: "आफ्नो खाताका विवरण हेर्नुहोस् र अद्यावधिक गर्नुहोस्।",
      navLabel: "मेरो प्रोफाइल",
      menu: {
        adminCenter: "एड्मिन कन्ट्रोल सेन्टर",
        myProfile: "मेरो प्रोफाइल",
        logout: "लग आउट"
      },
      identity: {
        heading: "खाताका विवरण",
        intro: "केवल हेर्नका लागि मात्र।",
        email: "इमेल",
        phone: "फोन",
        role: "भूमिका",
        memberSince: "खाता बनाइएको मिति",
        verified: "प्रमाणित",
        notVerified: "अप्रमाणित",
        oauthBadge: "बाह्य लगइन प्रयोग गरिएको",
        roleLabels: { USER: "प्रयोगकर्ता", ADMIN: "व्यवस्थापक" },
        notAvailable: "उपलब्ध छैन"
      },
      avatar: {
        heading: "प्रोफाइल तस्वीर",
        intro: "JPG, PNG वा WEBP, अधिकतम ५ MB।",
        change: "तस्वीर परिवर्तन गर्नुहोस्",
        uploading: "अपलोड हुँदै..."
      },
      profile: {
        heading: "आधारभूत जानकारी",
        intro: "नाम र युजरनेम अद्यावधिक गर्नुहोस्।",
        name: "पूरा नाम",
        username: "युजरनेम",
        save: "सुरक्षित गर्नुहोस्"
      },
      password: {
        heading: "पासवर्ड परिवर्तन",
        intro: "सुरक्षाको लागि नियमित अन्तरालमा पासवर्ड बदल्नुहोस्।",
        current: "हालको पासवर्ड",
        next: "नयाँ पासवर्ड",
        confirm: "नयाँ पासवर्ड पुनः लेख्नुहोस्",
        save: "पासवर्ड बदल्नुहोस्",
        oauthDisabled: "तपाईंले बाह्य लगइन (Google जस्तो) प्रयोग गरेर खाता खोल्नुभएको छ, त्यसैले यहाँ पासवर्ड परिवर्तन उपलब्ध छैन।"
      },
      validation: {
        required: "यो विवरण आवश्यक छ।",
        passwordMismatch: "नयाँ पासवर्ड मेल खाँदैन।",
        passwordTooShort: "पासवर्ड कम्तीमा ८ अक्षरको हुनुपर्छ।",
        avatarTooLarge: "तस्वीर ५ MB भन्दा सानो हुनुपर्छ।",
        avatarBadType: "PNG, JPG वा WEBP फाइल मात्र अनुमति छ।"
      },
      errors: {
        usernameTaken: "यो युजरनेम पहिल्यै लिइसकिएको छ।",
        wrongCurrentPassword: "हालको पासवर्ड मिलेन।",
        samePassword: "नयाँ पासवर्ड हालकोभन्दा फरक हुनुपर्छ।",
        loadFailed: "प्रोफाइल लोड गर्न सकिएन।",
        retry: "फेरि प्रयास गर्नुहोस्"
      },
      success: {
        profileSaved: "प्रोफाइल अद्यावधिक भयो।",
        avatarSaved: "तस्वीर अद्यावधिक भयो।",
        passwordChanged: "पासवर्ड बदलियो।"
      }
    },
    issues: {
      list: {
        eyebrow: "समुदायका समस्याहरू",
        title: "स्थानीय समस्या, समुदायको साथ",
        intro:
          "समुदायका सदस्यले रिपोर्ट गरेका सफाइ सम्बन्धी समस्याहरू हेर्नुहोस्। महत्त्वपूर्ण लाग्ने समस्यामा समर्थन जनाउनुहोस् र छिमेकलाई पनि सहभागी हुन आह्वान गर्नुहोस्।"
      },
      filters: {
        statusLabel: "स्थिति",
        statusPlaceholder: "सबै स्थिति",
        categoryLabel: "क्षेत्र",
        categoryPlaceholder: "सबै क्षेत्र",
        sortLabel: "क्रमबद्ध",
        sortMostVotes: "सबैभन्दा बढी समर्थन",
        sortNewest: "नयाँ पहिले"
      },
      statusLabels: {
        OPEN: "खुला",
        EVENT_SCHEDULED: "अभियान तय",
        COMPLETED: "सम्पन्न"
      },
      categoryLabels: {
        ROADSIDE: "सडक र फुटपाथ",
        VACANT_LAND: "खाली जग्गा",
        RIVERBANK: "नदी किनार",
        DRAINAGE: "ढल र नाला",
        PARK_PUBLIC_SPACE: "पार्क र सार्वजनिक स्थान",
        HIKING_TRAIL: "पदयात्रा मार्ग",
        OTHER: "अन्य"
      },
      card: {
        supportersOne: "१ समर्थक",
        supportersMany: "{n} समर्थक",
        viewDetail: "विस्तृत",
        voteAction: "समर्थन गर्नुहोस्",
        voteDisabledTooltip: "समर्थन जनाउन साइन इन गर्नुहोस्"
      },
      states: {
        loading: "समस्याहरू लोड हुँदै...",
        emptyTitle: "कुनै समस्या भेटिएन",
        emptyBody: "फिल्टर हटाएर पुनः हेर्नुहोस् वा पछि फेरि भेट्न आउनुहोस् — समुदायले निरन्तर नयाँ समस्या थप्दैछ।",
        errorTitle: "समस्याहरू लोड गर्न सकिएन",
        errorBody: "सर्भरसँग जोडिँदा केही गडबड भयो। केही क्षणपछि फेरि प्रयास गर्नुहोस्।",
        retry: "फेरि प्रयास गर्नुहोस्"
      },
      detail: {
        backToList: "सबै समस्यामा फर्किनुहोस्",
        reportedOn: "रिपोर्ट मिति",
        locationLabel: "स्थान",
        categoryLabel: "क्षेत्र",
        statusLabel: "स्थिति",
        descriptionTitle: "समस्याबारे विवरण",
        evidenceTitle: "तस्वीर र प्रमाण",
        noEvidence: "अहिलेसम्म कुनै तस्वीर अपलोड भएको छैन।",
        relatedTitle: "यस क्षेत्रका अन्य समस्याहरू",
        noRelated: "यस क्षेत्रमा अहिले अरू समस्या रिपोर्ट गरिएको छैन।",
        notFoundTitle: "समस्या भेटिएन",
        notFoundBody: "यो समस्या हटाइएको हुनसक्छ वा लिंक गलत छ।",
        shareTitle: "साझेदारी गर्नुहोस्",
        shareCopyLink: "लिङ्क प्रतिलिपि गर्नुहोस्",
        shareCopied: "लिङ्क प्रतिलिपि भयो",
        locationTitle: "स्थान",
        openInMaps: "नक्सामा खोल्नुहोस्",
        galleryAria: "फोटो ग्यालरी",
        viewPhoto: "फोटो ठूलो हेर्नुहोस्",
        photoCount: "{n} तस्वीर",
        rejectedNote: "यो समस्या अस्वीकृत गरिएको छ।",
        duplicateNote: "यो समस्या डुप्लिकेट रिपोर्ट हो।"
      }
    },
    issues: {
      list: {
        eyebrow: "समुदायका समस्याहरू",
        title: "स्थानीय समस्याहरू, समुदायको प्रतिक्रिया",
        intro:
          "समुदायका सदस्यले रिपोर्ट गरेका सरसफाइ सम्बन्धी समस्याहरू हेर्नुहोस्। महत्त्वपूर्ण लाग्ने समस्यामा समर्थन देखाउनुहोस् र छिमेकीहरूलाई पनि सहभागी हुन आह्वान गर्नुहोस्।"
      },
      filters: {
        statusLabel: "स्थिति",
        statusPlaceholder: "सबै स्थिति",
        categoryLabel: "क्षेत्र",
        categoryPlaceholder: "सबै क्षेत्र",
        sortLabel: "क्रमबद्ध",
        sortMostVotes: "सबैभन्दा बढी समर्थन",
        sortNewest: "नयाँ पहिले"
      },
      statusLabels: {
        OPEN: "खुला",
        EVENT_SCHEDULED: "अभियान तय",
        COMPLETED: "सम्पन्न"
      },
      categoryLabels: {
        ROADSIDE: "सडक र फुटपाथ",
        VACANT_LAND: "खाली जग्गा",
        RIVERBANK: "नदी किनार",
        DRAINAGE: "ढल र नाला",
        PARK_PUBLIC_SPACE: "पार्क र सार्वजनिक स्थान",
        HIKING_TRAIL: "पदयात्रा मार्ग",
        OTHER: "अन्य"
      },
      card: {
        supportersOne: "१ समर्थक",
        supportersMany: "{n} समर्थक",
        viewDetail: "विस्तृत",
        voteAction: "समर्थन गर्नुहोस्",
        voteActionDone: "समर्थन गरियो",
        voteDisabledTooltip: "समर्थन गर्न साइन इन गर्नुहोस्",
        voteSuccess: "तपाईंको समर्थन रेकर्ड भयो।",
        voteAlreadyVoted: "तपाईंले पहिले नै यो समस्यामा समर्थन गर्नुभएको छ।",
        voteForbidden: "समर्थन गर्न खाता प्रमाणित गर्न आवश्यक छ।",
        voteError: "समर्थन रेकर्ड गर्न सकिएन। कृपया फेरि प्रयास गर्नुहोस्।"
      },
      states: {
        loading: "समस्याहरू लोड हुँदै...",
        emptyTitle: "कुनै समस्या भेटिएन",
        emptyBody:
          "फिल्टर हटाएर वा पछि फेरि हेर्नुहोस् — समुदायले निरन्तर नयाँ समस्या थप्दैछ।",
        errorTitle: "समस्याहरू लोड गर्न सकिएन",
        errorBody:
          "सर्भरसँग जोडिँदा केही गडबड भयो। केही क्षणपछि फेरि प्रयास गर्नुहोस्।",
        retry: "फेरि प्रयास गर्नुहोस्"
      },
      pagination: {
        previous: "अघिल्लो",
        next: "अर्को",
        ariaLabel: "पृष्ठहरू"
      },
      detail: {
        backToList: "सबै समस्यामा फर्किनुहोस्",
        reportedOn: "रिपोर्ट मिति",
        locationLabel: "स्थान",
        categoryLabel: "क्षेत्र",
        statusLabel: "स्थिति",
        descriptionTitle: "समस्याबारे विवरण",
        evidenceTitle: "तस्वीर र प्रमाण",
        noEvidence: "अहिलेसम्म कुनै तस्वीर अपलोड भएको छैन।",
        relatedTitle: "यस क्षेत्रका अन्य समस्याहरू",
        noRelated: "यस क्षेत्रमा अहिले अरू समस्या रिपोर्ट गरिएको छैन।",
        notFoundTitle: "समस्या भेटिएन",
        notFoundBody: "यो समस्या हटाइएको हुनसक्छ वा लिङ्क गलत छ।",
        shareTitle: "साझेदारी गर्नुहोस्",
        shareCopyLink: "लिङ्क प्रतिलिपि गर्नुहोस्",
        shareCopied: "लिङ्क प्रतिलिपि भयो",
        locationTitle: "स्थान",
        openInMaps: "नक्सामा खोल्नुहोस्",
        galleryAria: "फोटो ग्यालरी",
        viewPhoto: "फोटो ठूलो हेर्नुहोस्",
        photoCount: "{n} तस्वीर",
        rejectedNote: "यो समस्या अस्वीकृत गरिएको छ।",
        duplicateNote: "यो समस्या डुप्लिकेट रिपोर्ट हो।"
      }
    },
    footer: {
      brand: "श्रमदान",
      ariaLabel: "श्रमदान footer",
      intro: "देशका हरेक समस्या सरकारको प्रतीक्षा गरेर समाधान हुँदैन। हामी नागरिकहरू आफैं मिलेर सरसफाइ, मर्मत, वृक्षारोपण, टोल सुधार जस्ता आधारभूत काम अघि बढाउन सक्छौँ। श्रमदान त्यही सामूहिक जिम्मेवारीको सुरुवात हो। साना साना हातहरू मिलेर ठूला परिवर्तन सम्भव हुन्छ। आज हाम्रो श्रमदान, भोलि सुन्दर समाजको निर्माण।",
      note: "हाम्रो श्रम, हाम्रो समाज, हाम्रो भविष्य।",
      columns: {
        quickLinks: "द्रुत लिंकहरू",
        getInvolved: "सहभागी हुनुहोस्",
        social: "सामाजिक सञ्जाल"
      },
      links: {
        contributor: "योगदान गर्नुहोस्",
        feedback: "प्रतिक्रिया दिनुहोस्"
      },
      social: [
        { id: "facebook", label: "फेसबुकमा श्रमदान", href: "https://www.facebook.com/profile.php?id=61589961623195" },
        { id: "twitter", label: "ट्विटर/एक्समा श्रमदान", href: "#" },
        { id: "tiktok", label: "टिकटकमा श्रमदान", href: "#" },
        { id: "youtube", label: "युट्युबमा श्रमदान", href: "#" }
      ]
    }
  },
  en: {
    brand: "Shramdan",
    nav: {
      home: "Home",
      issues: "Issues",
      join: "Join",
      feedback: "Feedback",
      login: "Login"
    },
    ariaLabels: {
      home: "Shramdan home",
      nav: "Main navigation",
      preferences: "Site preferences",
      toggleTheme: "Toggle theme",
      openMenu: "Open navigation",
      heroPanel: "Shramdan action hub",
      userMenu: "User menu"
    },
    controls: {
      language: "नेपाली",
      languageTooltip: "नेपाली भाषामा बदल्नुहोस्",
      themeTooltip: "Switch theme",
      darkTheme: "Dark theme",
      lightTheme: "Light theme"
    },
    hero: {
      eyebrow: "",
      title: "Shramdan",
      subtitle: "Our labor, our society, our future.",
      support: "Not every problem in the country will be solved by waiting for the government. As citizens, we can come together to move basic work forward ourselves, from cleanups and repairs to tree planting and neighborhood improvement. Shramdan is the beginning of that shared responsibility. Small hands together can make big change possible. Our Shramdan today builds a better society tomorrow.",
      join: "Contribute"
    },
    heroPanel: {
      kicker: "Help us build the app",
      title: "Build the Shramdan App with shramdan",
      body:
        "Shramdan is now in its app-building phase. Contributors can donate their time, skill, ideas, and coordination to help shape the platform itself.",
      resourcesLabel: "Useful Shramdan links",
      liveBadge: "LIVE",
      liveAria: "Live right now",
      resources: [
        {
          id: "participate",
          title: "Participate Live",
          label: "Google Meet, 12 PM Mon–Fri"
        },
        {
          id: "watchLive",
          title: "Watch Live Stream",
          label: "YouTube, 12 PM Mon–Fri"
        },
        {
          id: "discord",
          title: "Discord Community",
          label: "Chat, ask, and follow updates"
        }
      ]
    },
    buildInPublic: {
      heroLabel: "App Build Progress",
      heroAria: "Overall app build progress",
      roadmapCta: "See Detailed Roadmap",
      roadmapHref: "https://github.com/yantracore/shramdan-web/blob/main/docs/00-master-roadmap.md",
      phaseLabel: "Phase",
      sectionEyebrow: "What's Happening Now",
      sectionTitle: "Recent Progress on the Shramdan App",
      sectionIntro:
        "Work actively underway in our daily 12 PM live stream, what's lined up next, and features that just shipped. This list comes straight from the roadmap and updates itself as work moves forward.",
      statusActive: "In Progress",
      statusUpcoming: "Up Next",
      statusShipped: "Just Shipped",
      relativeToday: "Shipped today",
      relativeYesterday: "Shipped yesterday",
      relativeDaysAgo: "Shipped {n} days ago",
      relativeUpcoming: "On deck",
      fallbackBlurb: "Active work in this part of the roadmap; full detail on the roadmap.",
      fullRoadmapCta: "Read The Roadmap",
      taskOverrides: {
        "1.5.1": {
          title: "Vote on community issues",
          blurb:
            "Signed-in members can support an issue with one tap. The option to withdraw a vote is coming soon.",
          iconKey: "vote"
        },
        "1.5.3": {
          title: "Pick your role when voting",
          blurb:
            "Volunteer, donor, or just interested — choose how you're backing this issue when you cast a vote.",
          iconKey: "auth"
        },
        "14.1": {
          title: "Live build progress on the homepage",
          blurb:
            "The section you're looking at right now — pulled straight from the roadmap, updates as daily work moves.",
          iconKey: "roadmap"
        },
        "1.5.2": {
          title: "Instant feedback when you vote",
          blurb:
            "The count moves the moment you tap. If you aren't signed in, we take you straight to the sign-in page.",
          iconKey: "vote"
        },
        "1.4": {
          title: "Issue sharing + rich link previews",
          blurb:
            "Share any issue to Facebook, X (Twitter), WhatsApp, or Telegram — with a clean preview attached.",
          iconKey: "share"
        },
        "1.2": {
          title: "Full issue detail page",
          blurb:
            "Every issue gets its own page — full story, location, evidence photos, and supporter count in one place.",
          iconKey: "page"
        },
        "1.1": {
          title: "Public issues list",
          blurb:
            "Browse every reported issue. Filter and sort by status, category, or most-supported — all in the open.",
          iconKey: "list"
        },
        "0.3": {
          title: "Homepage + intro",
          blurb:
            "The Shramdan mission, ways to participate, and volunteer roles — all on one page. Your entry point.",
          iconKey: "home"
        },
        "0.5": {
          title: "Login + admin shell",
          blurb: "Token-based sign-in and a role-gated admin control center for moderators.",
          iconKey: "auth"
        },
        "0.7": {
          title: "Nepali + English bilingual coverage",
          blurb:
            "Every public page reads in both languages — flip with the language toggle at the top.",
          iconKey: "translate"
        },
        "3.2": {
          title: "Public campaign page",
          blurb:
            "Each cleanup campaign gets a page with date, location, goal, and what kind of help is needed.",
          iconKey: "campaign"
        },
        "2.1": {
          title: "Phone + OTP signup",
          blurb: "Sign up with just a phone number — no email required. Made for mobile-first onboarding.",
          iconKey: "mobile"
        },
        "13.2": {
          title: "Community impact reports",
          blurb:
            "Public dashboard with issue counts, events run, and volunteers active — open numbers, nothing hidden.",
          iconKey: "report"
        },
        "14.2": {
          title: "Dedicated build-progress page",
          blurb:
            "A full view of the roadmap — every phase, every task, every percentage — for anyone who wants the detail.",
          iconKey: "roadmap"
        },
        "14.3": {
          title: "Public voting on features (Polls)",
          blurb:
            "When we have to choose between options, the community votes. You help shape the roadmap.",
          iconKey: "vote"
        }
      }
    },
    cleanupAreas: {
      eyebrow: "What we clean",
      title: "Cleanup Areas We Start With",
      intro:
        "Shramdan begins with visible local cleanup work people can understand, join, and measure quickly - one place at a time.",
      items: [
        {
          id: "roadside",
          image: "/images/homepage/cleanup-areas/roadside.png",
          imageAlt: "Volunteers cleaning a roadside area",
          title: "Street & Roadside",
          body: "Clean visible litter along roads, alleys, footpaths, and street edges."
        },
        {
          id: "lands",
          image: "/images/homepage/cleanup-areas/empty-lands.png",
          imageAlt: "Volunteers collecting waste from vacant land",
          title: "Vacant Lands",
          body: "Turn neglected plots and open grounds into cleaner, safer local spaces."
        },
        {
          id: "riverbanks",
          image: "/images/homepage/cleanup-areas/riverbanks.png",
          imageAlt: "Cleanup work along a riverbank",
          title: "Riverbanks & Waterways",
          body: "Remove waste from riversides, streams, ponds, and nearby water routes."
        },
        {
          id: "drains",
          image: "/images/homepage/cleanup-areas/drains.png",
          imageAlt: "Team cleaning drains and gullies",
          title: "Drains & Gullies",
          body: "Keep drains, gullies, and waterlogged corners clean and flowing."
        },
        {
          id: "parks",
          image: "/images/homepage/cleanup-areas/parks.png",
          imageAlt: "Volunteers cleaning a park and public space",
          title: "Parks & Public Spaces",
          body: "Clean parks, squares, bus stops, community zones, and gathering spaces."
        },
        {
          id: "trails",
          image: "/images/homepage/cleanup-areas/nature-trails.png",
          imageAlt: "Group cleaning a nature trail",
          title: "Hiking Trails & Nature Routes",
          body: "Protect forest paths, viewpoints, trails, and nature routes from litter."
        }
      ]
    },
    coreIdea: {
      eyebrow: "Core Idea",
      title:
        "Shramdan App turns local problems into community events through reporting, voting, and labour contribution.",
      phaseNote: "In the first phase, we start with community cleanup only.",
      steps: [
        {
          id: "listing",
          image: "/images/homepage/core-idea/listing.png",
          imageAlt: "Listing step visual",
          title: "Listing",
          body: "Members report local issues with location and photos."
        },
        {
          id: "vote",
          image: "/images/homepage/core-idea/vote.png",
          imageAlt: "Voting step visual",
          title: "Vote",
          body: "Members vote to prioritize important issues."
        },
        {
          id: "plan",
          image: "/images/homepage/core-idea/plan.png",
          imageAlt: "Planning step visual",
          title: "Plan",
          body: "Top issues are selected and members are notified."
        },
        {
          id: "event",
          image: "/images/homepage/core-idea/events.png",
          imageAlt: "Cleanup event step visual",
          title: "Event",
          body: "Cleanup events are organized, completed, and documented."
        },
        {
          id: "results",
          image: "/images/homepage/core-idea/results.png",
          imageAlt: "Results step visual",
          title: "Results",
          body: "Results are shared publicly in the Shramdan app."
        }
      ]
    },
    volunteerInvite: {
      brandLine: "Donate Your Labour. Build Your Community.",
      eyebrow: "Volunteer invitation",
      titleLead: "Build",
      titleStrong: "Shramdan with us",
      titleTrail: "for Nepal",
      intro:
        "Shramdan is a community-driven platform open to everyone. Bring your skill, time, or network, build your team, and start local impact.",
      primaryCta: "Become a Volunteer",
      secondaryCta: "Share Feedback",
      panelEyebrow: "We need you",
      panelTitle: "Take any role and contribute to App Development.",
      panelIntro:
        "Code, design, law, finance, donation, or local leadership - there is a clear way to contribute to Shramdan.",
      cardCta: "Contribute",
      goal: {
        title: "Our goal: community-led ownership",
        body:
          "We are building the foundation so communities can run projects, make decisions, and own the impact wherever possible."
      },
      roles: [
        {
          id: "frontend",
          value: "FRONTEND_DEVELOPER",
          title: "Frontend Developer",
          badge: "1 Volunteer",
          description: "React, Next.js, UI implementation."
        },
        {
          id: "backend",
          value: "BACKEND_DEVELOPER",
          title: "Backend Developer",
          badge: "1 Volunteer",
          description: "Node.js, APIs, database design."
        },
        {
          id: "qa",
          value: "QA_ENGINEER",
          title: "QA / Quality Analyst",
          badge: "1 Volunteer",
          description: "Test the app, file bugs, sign off on quality before release."
        },
        {
          id: "devops",
          value: "DEVOPS_ENGINEER",
          title: "DevOps Engineer",
          badge: "1 Volunteer",
          description: "Server setup, CI/CD, deployments, monitoring."
        },
        {
          id: "uiux",
          value: "UI_UX_DESIGNER",
          title: "UI/UX Designer",
          badge: "1 Volunteer",
          description: "User experience, wireframes, design systems."
        },
        {
          id: "graphics",
          value: "GRAPHICS_DESIGNER",
          title: "Graphics Designer",
          badge: "1 Volunteer",
          description: "Branding, visuals, illustrations, motion."
        },
        {
          id: "content",
          value: "CONTENT_WRITER",
          title: "Content Writer",
          badge: "1 Volunteer",
          description: "Articles, case studies, community stories — bilingual."
        },
        {
          id: "legal",
          value: "LEGAL",
          title: "Lawyer / Legal",
          badge: "1 Volunteer",
          description: "Legal guidance, organization, compliance."
        },
        {
          id: "finance",
          value: "FINANCE",
          title: "Financial Advisor",
          badge: "1 Volunteer",
          description: "Financial planning, transparency, strategy."
        },
        {
          id: "donors",
          value: "DONOR",
          title: "Donors",
          badge: "Every contribution matters",
          description: "Fund the mission. Create real impact."
        },
        {
          id: "leaders",
          value: "COMMUNITY_MANAGER",
          title: "Community Leaders",
          badge: "Local impact makers",
          description: "Organize locally. Mobilize people."
        }
      ]
    },
    resources: {
      eyebrow: "Open sources",
      title: "Open Development Resources",
      intro: "Shramdan keeps its mission, walkthrough, documents, and source code public so anyone can learn, review, and contribute.",
      playlist: {
        title: "Shramdan development playlist",
        description: "Watch the Shramdan development walkthrough, livestream, and project context directly from this page.",
        embedUrl: "https://www.youtube-nocookie.com/embed/videoseries?list=PLWkh0s4xHPcTF4FOcYjkdR3i97YbkSDGo",
        playlistUrl: "https://www.youtube.com/playlist?list=PLWkh0s4xHPcTF4FOcYjkdR3i97YbkSDGo",
        button: "Watch Full Playlist on YouTube"
      },
      items: [
        {
          id: "participate",
          title: "Participate Live",
          description: "Join the daily Shramdan working session on Google Meet, 12 PM Monday to Friday.",
          button: "Participate",
          href: "https://meet.google.com/kwi-kqyi-iyf"
        },
        {
          id: "watchLive",
          title: "Watch Live Stream",
          description: "Tune in to the development livestream on YouTube, 12 PM Monday to Friday.",
          button: "Watch Live",
          href: "https://www.youtube.com/@yantracore/streams"
        },
        {
          id: "discord",
          title: "Discord Community",
          description: "Chat with the community, ask questions, and follow updates on Discord.",
          button: "Join Discord",
          href: "https://discord.gg/Cd57PXxf"
        },
        {
          id: "presentation",
          title: "Livestream Presentation Slides",
          description: "Mission notes and the full development walkthrough from the Shramdan livestream.",
          button: "Open Slides",
          href: "https://drive.google.com/drive/folders/19Iuu_W7GRhD9F6qph0A8drKJQlN2UbUy"
        },
        {
          id: "roadmap",
          title: "Development Roadmap",
          description: "The full master roadmap — phases, tasks, and progress that drive the Shramdan app build.",
          button: "Open Roadmap",
          href: "https://github.com/yantracore/shramdan-web/blob/main/docs/00-master-roadmap.md"
        },
        {
          id: "documents",
          title: "GitHub Documentation",
          description: "Planning, design, implementation, API reference, and safety/event model docs maintained directly in the source repo.",
          button: "Open GitHub Docs",
          href: "https://github.com/yantracore/shramdan-web/tree/main/docs"
        },
        {
          id: "github",
          title: "GitHub Repository",
          description: "Public open-source repo with the source code, issues, and contribution history.",
          button: "View Repo",
          href: "https://github.com/yantracore/shramdan-web"
        },
        {
          id: "apiDocs",
          title: "API Documentation",
          description: "Public API docs for backend endpoints, request formats, and testing references.",
          button: "Open API Docs",
          href: "https://backend.shramdan.org/api-docs/"
        }
      ]
    },
    join: {
      eyebrow: "Join the community",
      title: "Contributor Application",
      intro: "Use your skills, time, and energy to help build Shramdan.",
      name: "Full name",
      email: "Email address",
      phone: "Phone number",
      role: "Role",
      portfolio: "Portfolio URL",
      resumeUrl: "Resume URL",
      experience: "Your experience",
      motivation: "Why do you want to contribute to Shramdan?",
      additionalInfo: "Additional information",
      submit: "Submit Application"
    },
    feedback: {
      eyebrow: "We need your feedback",
      title: "Feedback Form",
      intro: "Suggestions, issues, questions, and general feedback all help shape Shramdan.",
      name: "Full name",
      email: "Email address",
      type: "Feedback type",
      experienceRating: "Experience rating",
      message: "Your feedback",
      screenshot: "Screenshot URL",
      submit: "Submit Feedback"
    },
    placeholders: {
      joinName: "e.g. Muna Gurung",
      name: "e.g. Muna Gurung",
      email: "e.g. muna@example.com",
      phone: "+9779800000000",
      role: "Select a role",
      portfolio: "https://example.com",
      resumeUrl: "https://example.com/resume.pdf",
      experience: "Write your background, experience, or achievements...",
      motivation: "Write your motivation...",
      additionalInfo: "Write your availability, interests, or other notes...",
      feedbackType: "Select a type",
      feedback: "Write your feedback, suggestion, or concern...",
      screenshot: "https://example.com/screenshot.png"
    },
    options: {
      applicationRoles: [
        { label: "Frontend Developer", value: "FRONTEND_DEVELOPER" },
        { label: "Backend Developer", value: "BACKEND_DEVELOPER" },
        { label: "QA / Quality Analyst", value: "QA_ENGINEER" },
        { label: "DevOps Engineer", value: "DEVOPS_ENGINEER" },
        { label: "UI/UX Designer", value: "UI_UX_DESIGNER" },
        { label: "Graphics Designer", value: "GRAPHICS_DESIGNER" },
        { label: "Content Writer", value: "CONTENT_WRITER" },
        { label: "Legal", value: "LEGAL" },
        { label: "Finance", value: "FINANCE" },
        { label: "Donor", value: "DONOR" },
        { label: "Community Manager", value: "COMMUNITY_MANAGER" },
        { label: "Volunteer", value: "VOLUNTEER" },
        { label: "Other", value: "OTHER" }
      ],
      feedbackTypes: [
        { label: "Suggestion", value: "SUGGESTION" },
        { label: "Bug report", value: "BUG_REPORT" },
        { label: "Question", value: "QUESTION" },
        { label: "General", value: "GENERAL" }
      ]
    },
    messages: {
      join: "Contributor application was sent to the API.",
      feedback: "Feedback was sent to the API.",
      required: "This field is required.",
      email: "Please enter a valid email address.",
      submitError: "Could not submit. Please try again."
    },
    me: {
      title: "My profile",
      intro: "Review and update your account details.",
      navLabel: "My profile",
      menu: {
        adminCenter: "Admin Control Center",
        myProfile: "My profile",
        logout: "Logout"
      },
      identity: {
        heading: "Account details",
        intro: "Read-only information.",
        email: "Email",
        phone: "Phone",
        role: "Role",
        memberSince: "Member since",
        verified: "Verified",
        notVerified: "Not verified",
        oauthBadge: "External login",
        roleLabels: { USER: "User", ADMIN: "Admin" },
        notAvailable: "Not provided"
      },
      avatar: {
        heading: "Profile photo",
        intro: "JPG, PNG, or WEBP up to 5 MB.",
        change: "Change photo",
        uploading: "Uploading..."
      },
      profile: {
        heading: "Basic information",
        intro: "Update your name and username.",
        name: "Full name",
        username: "Username",
        save: "Save"
      },
      password: {
        heading: "Change password",
        intro: "Rotate your password regularly to stay secure.",
        current: "Current password",
        next: "New password",
        confirm: "Confirm new password",
        save: "Update password",
        oauthDisabled: "You signed in with an external provider (e.g. Google), so password change is not available here."
      },
      validation: {
        required: "This field is required.",
        passwordMismatch: "New password and confirmation do not match.",
        passwordTooShort: "Password must be at least 8 characters.",
        avatarTooLarge: "Image must be smaller than 5 MB.",
        avatarBadType: "Only PNG, JPG, or WEBP files are allowed."
      },
      errors: {
        usernameTaken: "This username is already taken.",
        wrongCurrentPassword: "The current password is incorrect.",
        samePassword: "New password must differ from the current one.",
        loadFailed: "Could not load profile.",
        retry: "Try Again"
      },
      success: {
        profileSaved: "Profile updated.",
        avatarSaved: "Photo updated.",
        passwordChanged: "Password changed."
      }
    },
    issues: {
      list: {
        eyebrow: "Community issues",
        title: "Local problems looking for community action",
        intro:
          "Browse cleanup-related issues reported by community members. Support what matters most and invite your neighborhood to join in."
      },
      filters: {
        statusLabel: "Status",
        statusPlaceholder: "All Statuses",
        categoryLabel: "Category",
        categoryPlaceholder: "All Categories",
        sortLabel: "Sort By",
        sortMostVotes: "Most Supported",
        sortNewest: "Newest First"
      },
      statusLabels: {
        OPEN: "Open",
        EVENT_SCHEDULED: "Campaign scheduled",
        COMPLETED: "Completed"
      },
      categoryLabels: {
        ROADSIDE: "Roadside",
        VACANT_LAND: "Vacant land",
        RIVERBANK: "Riverbank",
        DRAINAGE: "Drainage",
        PARK_PUBLIC_SPACE: "Park / public space",
        HIKING_TRAIL: "Hiking trail",
        OTHER: "Other"
      },
      card: {
        supportersOne: "1 supporter",
        supportersMany: "{n} supporters",
        viewDetail: "Details",
        voteAction: "Support",
        voteDisabledTooltip: "Sign in to support"
      },
      states: {
        loading: "Loading issues...",
        emptyTitle: "No issues found",
        emptyBody: "Try clearing filters or check back later — new reports come in often.",
        errorTitle: "Could not load issues",
        errorBody: "Something went wrong while reaching the server. Please try again in a moment.",
        retry: "Try Again"
      },
      detail: {
        backToList: "Back to All Issues",
        reportedOn: "Reported on",
        locationLabel: "Location",
        categoryLabel: "Category",
        statusLabel: "Status",
        descriptionTitle: "About this issue",
        evidenceTitle: "Photos and evidence",
        noEvidence: "No photos uploaded yet.",
        relatedTitle: "Other issues in this category",
        noRelated: "No other issues in this category yet.",
        notFoundTitle: "Issue not found",
        notFoundBody: "This issue may have been removed, or the link is incorrect.",
        shareTitle: "Share this issue",
        shareCopyLink: "Copy Link",
        shareCopied: "Link copied",
        locationTitle: "Location",
        openInMaps: "Open in Maps",
        galleryAria: "Photo gallery",
        viewPhoto: "View photo",
        photoCount: "{n} photo",
        rejectedNote: "This issue has been rejected.",
        duplicateNote: "This issue is a duplicate report."
      }
    },
    issues: {
      list: {
        eyebrow: "Community issues",
        title: "Local problems looking for community action",
        intro:
          "Browse cleanup-related issues reported by community members. Support what matters most and invite your neighborhood to join in."
      },
      filters: {
        statusLabel: "Status",
        statusPlaceholder: "All Statuses",
        categoryLabel: "Category",
        categoryPlaceholder: "All Categories",
        sortLabel: "Sort By",
        sortMostVotes: "Most Supported",
        sortNewest: "Newest First"
      },
      statusLabels: {
        OPEN: "Open",
        EVENT_SCHEDULED: "Campaign scheduled",
        COMPLETED: "Completed"
      },
      categoryLabels: {
        ROADSIDE: "Roadside",
        VACANT_LAND: "Vacant land",
        RIVERBANK: "Riverbank",
        DRAINAGE: "Drainage",
        PARK_PUBLIC_SPACE: "Park / public space",
        HIKING_TRAIL: "Hiking trail",
        OTHER: "Other"
      },
      card: {
        supportersOne: "1 supporter",
        supportersMany: "{n} supporters",
        viewDetail: "Details",
        voteAction: "Support",
        voteActionDone: "Supported",
        voteDisabledTooltip: "Sign in to vote",
        voteSuccess: "Your support has been recorded.",
        voteAlreadyVoted: "You have already supported this issue.",
        voteForbidden: "Your account needs to be verified to vote.",
        voteError: "Could not record your support. Please try again."
      },
      states: {
        loading: "Loading issues...",
        emptyTitle: "No issues found",
        emptyBody:
          "Try clearing filters or check back later — new reports come in often.",
        errorTitle: "Could not load issues",
        errorBody:
          "Something went wrong while reaching the server. Please try again in a moment.",
        retry: "Try Again"
      },
      pagination: {
        previous: "Previous",
        next: "Next",
        ariaLabel: "Pagination"
      },
      detail: {
        backToList: "Back to All Issues",
        reportedOn: "Reported on",
        locationLabel: "Location",
        categoryLabel: "Category",
        statusLabel: "Status",
        descriptionTitle: "About this issue",
        evidenceTitle: "Photos and evidence",
        noEvidence: "No photos uploaded yet.",
        relatedTitle: "Other issues in this category",
        noRelated: "No other issues in this category yet.",
        notFoundTitle: "Issue not found",
        notFoundBody: "This issue may have been removed, or the link is incorrect.",
        shareTitle: "Share this issue",
        shareCopyLink: "Copy Link",
        shareCopied: "Link copied",
        locationTitle: "Location",
        openInMaps: "Open in Maps",
        galleryAria: "Photo gallery",
        viewPhoto: "View photo",
        photoCount: "{n} photo",
        rejectedNote: "This issue has been rejected.",
        duplicateNote: "This issue is a duplicate report."
      }
    },
    footer: {
      brand: "Shramdan",
      ariaLabel: "Shramdan footer",
      intro: "Not every problem in the country will be solved by waiting for the government. As citizens, we can come together to move basic work forward ourselves, from cleanups and repairs to tree planting and neighborhood improvement. Shramdan is the beginning of that shared responsibility. Small hands together can make big change possible. Our Shramdan today builds a better society tomorrow.",
      note: "Our labor, our society, our future.",
      columns: {
        quickLinks: "Quick Links",
        getInvolved: "Get Involved",
        social: "Social"
      },
      links: {
        contributor: "Contribute",
        feedback: "Share feedback"
      },
      social: [
        { id: "facebook", label: "Shramdan on Facebook", href: "https://www.facebook.com/profile.php?id=61589961623195" },
        { id: "twitter", label: "Shramdan on Twitter/X", href: "#" },
        { id: "tiktok", label: "Shramdan on TikTok", href: "#" },
        { id: "youtube", label: "Shramdan on YouTube", href: "#" }
      ]
    }
  }
};

export const toSelectOptions = (items) =>
  items.map((item) => (typeof item === "string" ? { label: item, value: item } : item));
