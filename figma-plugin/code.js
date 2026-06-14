// Dados embutidos (gerados de tokens.json, spacing.json e icons.json).
const TOKENS = {"text-primary":"011dc991a06eaae1d234d5744e6353e620098c49","text-tertiary":"992234487b4698ce4d7e3f40afb980536717007d","border-secondary":"bbeedea76f9373fc31cd06b4c78996b7e5133bb4","text-error-primary":"e7acfb01d372dbaecbb1ef12e1dfc6596d0115cc","border-error_subtle":"8f690f2043ffefe1b5511f254750fd4fbe950237","bg-primary":"d7cda17fdbe9607ec4c074e5facb29631b13c6a4","bg-tertiary":"916d10656c8fb2ef58cea3842698b199998c26c9","fg-secondary":"215bc984992905852141fab452207816ced08a77","bg-brand-primary":"040fdc0d08f52f3967aa635fc02b04a5bfd7f5f6","bg-error-secondary":"1fabcf4e63ac27412770c5a083ba80506e37afc8","bg-warning-primary":"359bbedb88685088c36676ba0ebd6c594e277e9d","bg-warning-secondary":"33de1db05fdff325591d9c9b219c9590ab1956b9","bg-success-primary":"ff37c8f0f7327acd0191051772d63d42dcf09ed7","bg-success-secondary":"f3b29b7455f43fea2ebdd4c22e3e124edf4d8136","fg-warning-primary":"41d5c4bbe9efc8f5c5b4a2964dcb6e8fe6183935","fg-success-primary":"b34066ff33666c7ed8494a66c21dbb4e826a3621","border-primary":"2364920c2b6dcfaa29ec02a5c03663718c13da44","text-warning-primary":"b0a11bab2da09556eeab5f398b4c6295bbac8630","text-success-primary":"15d5d072e7350ee3e4b3b779ed9c8210626e15cf","fg-white":"0ff26953239a709fac5b8bac692802cb625cd3cb","text-white":"c3b145e8b4259bfda8021f852e6357937be21993","bg-brand-solid":"e653849ca7f357f25d0cd79a2f8901150872173f","bg-secondary-solid":"e6a3ef641596e77435c726dc07fcad77346c2fb8","bg-error-solid":"02f005805af93d4c03fcb5dd7abc49a2f0db1741","bg-warning-solid":"6ace4a628cfaf4f895f8be979646c61190162c78","bg-success-solid":"4f4c7f42ea3ddc6c069ddb7523783348a5511b4b","fg-success-secondary":"f11ff775827f2331b240e80408412b9491439183","text-secondary":"bfd91d77d556745b503fcaa4d7fe23bb63fb3e31","bg-secondary_hover":"a3985fcdae2874cb1c3f625c6bda4e951f7f4292","fg-secondary_hover":"2d1f0e18d5811f74af23e0135188c1acbb645c96","bg-primary_hover":"adca2db2e295020f22fbb46aa864af083d4c9b87","fg-primary":"1da7f3c5bbac6164445d2ceafb8a2073c9d2f843","text-secondary_hover":"585bd824118ca24529eb47442ec155eb9567c76a","text-tertiary_hover":"45f3388f34dcaffc7eb42cbccd6b0107dcae3a6d","transparent":"028ef20edc730a93c9685b298da9389b6cda8087","bg-brand-solid_hover":"13394a01e8dbb55883dc4233f7c2a91e54a0470d","border-brand":"9ecf7ca7ea0acb06ca51ff82f2c4c3fea3e2b7a3","border-error":"b3ab024ad9008f1e068b4e321913678384c69b35","bg-error-primary":"3793197e8366303f5ed85f036ec271e66641c96e","fg-brand-secondary":"9ea3d2a78c9c2f677ebad9c71a707c2bf37df33b","bg-brand-secondary":"d0338b03b3c21136080ba0c14df664a1b2f05210","fg-brand-primary":"16bddebb3db6f5c2f778a155d80bef38e8d3665a","fg-quaternary":"2383c3ce4ab03f497706abe99a88ce84e1c634b6","fg-quaternary_hover":"1e20ad7d331cd5e3c8d140c6f5c9ee7b5c24644b","fg-error-primary":"1af5e2f99b86fa0669f7295008ffad53e73b8456","bg-secondary":"292f8b45e16e588d7c914334ad8798393b585b69","text-brand-secondary":"90150fb0577bc7bafa19a40b9e54785cf92fd9f9","utility-blue-600":"3e2701e589de0ced72ab236b07fea4a5c0f305b1","tooltip-supporting-text":"ea56e3d4950d61b6abad2592c13da7adf1329bbc","bg-quaternary":"2239c2faef2ef767d5e7add1f19bb27cd16d1db3","utility-brand-600":"e6dcf29eb55440b4ed91f97ccaf039d534ead022","utility-neutral-700":"f8cb9c258ee2011d8353ba786dd55ca7d4152021","utility-red-600":"f496135521707aeae756828057216a1a7bb58484","utility-yellow-600":"e869f2d7118bef07d3b35d053d37b50694580092","utility-green-600":"d006e7a3eabd6c12b8f7b8e303c203602b6810bd","utility-orange-600":"475c624a0cfb7c8d1f47152ae43e4b219c66dbd3","utility-indigo-600":"8d3145d93436b577583e0a9811415a3f75c6621f","utility-fuchsia-600":"828e2c0940280445794bf00e3af7d9dd1b99d59e","utility-pink-600":"5535e21a2afe87754a47150d96b623527458f062","utility-purple-600":"304270f29f26500a799b50abe122ac287891e388","utility-sky-600":"2092cda952b2cfc3d9a37818c39e9632cdfb6258","utility-neutral-600":"dae7d017622b65fcaddacbd10f4b966c7ce1d930","utility-brand-700":"58576db49c9aa6642a8d5538a17b659290d284ba","utility-red-700":"f300cc4ea2a64d9a11eb97e909a9209d82af3614","utility-yellow-700":"e0478278df3eb790c327b1646f8098edf6968bb8","utility-green-700":"b37b3eb679913da4fce81e471c65db7c45bf07a2","utility-indigo-700":"79d0e1399991c5785d351f2e5e3b819a93e7842d","utility-purple-700":"a00aa2511299137825f86be8b79bf645c52402cd","utility-fuchsia-700":"3c7e30dbc53c56cd1431261698e956eb40fd2f57","utility-pink-700":"10fe1406a4ad6c656018964d6c22b08f57f651dc","utility-orange-700":"6e5de53a9c758b6976840adb5c7b8d9be42babf2","utility-blue-700":"5dba9ee5c4597244d756e47049eb349014ca8f9a","utility-sky-700":"96bfea85df133b14285bf84b1cbe4330ede45380","utility-slate-600":"7db2062f0409c718b8b3c956e83a5a36700a7b9d","utility-slate-700":"09eccf0f51ad43f2fd8e1d6932d4b74bb32db3f1","utility-neutral-500":"6fee74950e1c73ffe3ff0d4a593d991669b94ff7","utility-brand-500":"9984b88fc0b02d9c0f472df11fffb1c907fc676d","utility-red-500":"6badee0a24c91515fdfb183337ed82b816392488","utility-yellow-500":"8191e22af58609bfdf008cf6b38d98632225af86","utility-green-500":"c35406fed8c68b8c529bcfae60bbdfd6166ce50c","utility-slate-500":"becb92d5df5922af5580036d5be00d64db41c8e4","utility-sky-500":"b687e00967f1d677225aa66297021d6e20f5f3f8","utility-blue-500":"8fc712b2cca7a4d30facdcf7dbe67db6a67e77e6","utility-indigo-500":"b44a3a778281157cc6171f0a63c7c28c00afb11b","utility-purple-500":"872205406d6cc91925e6fabd864ea20365490b53","utility-fuchsia-500":"92e19cc0ff8df14acaf5e341e1382d5c331b8c4c","utility-pink-500":"16fa49bf10d482a33630e28fabbc34f1e2b0ee76","utility-orange-500":"65c4d0c5933e48b56013cde90afbfa02eb781b3f","utility-neutral-200":"08faa45b0c7a6db6c33067581a3d32a24b7281a3","utility-brand-200":"4db43121087b45b6cda8b897f644729110647175","utility-red-200":"6a90d154d45adb903eb3d4a6c8c374c426305b7e","utility-yellow-200":"edef17628c3a52099aca4144f41430df5fcbffc5","utility-green-200":"edc4636dd3b7519575444f3b24a4450600ec4337","utility-slate-200":"871cb964384a193921cd09e537c2219c95a9b935","utility-sky-200":"96714b7f8fb719a213bea93f3f182ff6a6a50b30","utility-blue-200":"ed88d594c8eba9c6b4baf83a3847f2fcaf0014e3","utility-indigo-200":"43c5bf6828b94f52a4d7607cacab7321cfc18cf8","utility-purple-200":"09b469aabf52eb1f7a04d9596ed2ab75ba6c6073","utility-fuchsia-200":"00c2d813a3d7a81bae271bec55f205de8a5eee18","utility-pink-200":"d6a7e4c5cb1ecfed851c34d73762da4852243356","utility-orange-200":"7e681a468e2bc3266c1bd2a63e6b5bbd98707d66","utility-neutral-50":"2156982ddeee9e6b56c5dbfa8a6e4b3e962ff06c","utility-brand-50":"22d5f8f8e893d48ff815c3b07f6aa0a77056ea25","utility-red-50":"6031e4715b6abd207ae273936da80b7698b7ddb5","utility-yellow-50":"049a6b778df00d4f48a05f80db861605ff47d2aa","utility-green-50":"8e47e5c1420fa48bc063f45d95b2818e91a8a311","utility-slate-50":"8ca13ad1ae4090d5f24bbb10c3f3f043291ae9d7","utility-sky-50":"875d77a68741313198f39f595d140d3e53e20044","utility-blue-50":"2a0dfcea4bd3fb676d4da99b7b7759f99468f818","utility-indigo-50":"8649da4b04cc00561d0cc0e66e49037a24556cbe","utility-purple-50":"fc1a139adc445476bfd492c785f94389e606d567","utility-fuchsia-50":"f2bd7eda556d68d30a1341d589240e1f71711b07","utility-pink-50":"514ecc53d6abb0ea052ce557c0ad2f2dd8915cf2","utility-orange-50":"b0c5148745cf4206e8eb0f236568262613aa231f","utility-neutral-100":"8da08ccec59fbff3950535b34071dc1e33f70810","utility-brand-100":"5307ad2488483ef462442171ce255e46d26de773","utility-red-100":"ab037751198a4d71dd2157fbc28b9c6d5d01ffc6","utility-yellow-100":"3b5eb1b3cc1bb4e5c33d2f7813dfec2dd44bda2e","utility-green-100":"b89e216135329884b5a2eceb761a8134eee2c66f","utility-slate-100":"061deb7bc97adae0b5070f44dbca13642ad69a14","utility-sky-100":"a5869e1865846edde91dea336488cdb663d0d341","utility-blue-100":"86f40a7bf4746de93d4233f82bfebdfe719007fd","utility-indigo-100":"ba356620ae2075af0f82428a84153eb9ec936a1a","utility-purple-100":"1374c97a86595bc3cf45a66f57979048c0b3a7ac","utility-fuchsia-100":"48e23fe3204523ed9a7ce03c03304b0087e7531f","utility-pink-100":"54d1641ca4bf1bb66d904c6d3c735694a62db453","utility-orange-100":"969595e26731f40bc6081c78ef84609f7bc38655","utility-neutral-400":"12b4bb687cfb44ba5dbc78aae89690102680debf","utility-brand-400":"aa3cf8ec83c59b1d12c343fde54d6e3705fe6740","utility-red-400":"3768a7fa6a89d46f169cb1d987fa7d4c103e2074","utility-yellow-400":"ebd3a77c8aef51520c86b49c8d662fa07fe02dbb","utility-green-400":"58b50607a3beb0e0d81ad0b02abad652d46b4ef5","utility-slate-400":"afd50106f79c9e419fb03089aca6015888a34d52","utility-sky-400":"385bd53f0639f3e147917a2bc86e9cc4b351c609","utility-blue-400":"c02917e8e8cf03b6e2a81192a71887d2d74532ed","utility-indigo-400":"723d34fe3ee5ede86570b09635ec2ac21b5961dc","utility-purple-400":"2f8617c675250ed3a31ff8ca8acf6c066d22301a","utility-fuchsia-400":"5ed8f67545caeaad9c018164e04be42b8e920d55","utility-pink-400":"be98cf1384842f162bb67625e7ed2fbbc0cf1199","utility-orange-400":"a185d948e163472567eb4d705370fd50d42c76db","fg-warning-secondary":"1cfce779aa2f6fb93e8a46f275adecccb8211772","fg-error-secondary":"b05339cb6ed441b70b21f37a75e3ff1e65fabcde","text-placeholder":"e55ced57ad0db83577b70cc607d31b7c80f50f49","text-brand-tertiary":"5422f677610851e962a840c48f5ea1eb394f5e76","bg-primary_alt":"7636da89d161234021e8464fc56fa1786ae2652a","fg-tertiary":"6c8c844c4f7bfaa44abb26382bd7db032b0f7564","fg-tertiary_hover":"ef2f67837e104eadaf3577fcb96fd9183c337cb9","bg-brand-primary_alt":"75403a5cbd297a2f6c17df530d3422211868d054","fg-brand-primary_alt":"caf36f806cdb8f2e172250017849fcccfeaba521","bg-secondary_alt":"85324b98d471cd1da5e776d78ab2df9ac6b7fd25","alpha-white-90":"4fbaacda1b9bd349d2c482f441fa8bc46609bdf8","alpha-white-80":"3ef50e8145db12e879b870c1093d21977a90e174","alpha-white-70":"b43a1b7cbb2ceb74cf6b387dc925b65024c634e0","alpha-white-60":"8d215bae6713b6ff8b4b39a06d545e178f3cf5f8","alpha-white-50":"1454fe4f8174df3f967d7ae7d36601c898b43ae1","alpha-white-40":"054fc14c8b7d53e6d7827eab7db56a613c307aba","alpha-white-30":"2e621fc4a59b36b2af3cbdc92d1da4d95a7b202b","alpha-white-20":"0f60f12dc3ed0102d396ec7596606457abe04868","alpha-white-10":"a719482577b71b47b44d8f841ebb80c640d87d07","alpha-black-10":"bd4443c1aebaa8897273821f715bdeeb243664c2","alpha-black-20":"7a16f9037b011e9e1319686e926e35aeda598d8e","alpha-black-30":"16e5cf3e204f76dd028044d0b06b999d011e4b17","alpha-black-40":"1497c4602255ab2c402765a30131e6b7847381db","alpha-black-50":"feca48d5d149622f122bef129cd5d1391bb7163c","alpha-black-60":"5887362be807d83ff51b60c5925964c2fc65aa2a","alpha-black-70":"17006a03c38e93e5694ce18d7167de60147e29ca","alpha-black-80":"f8fc637ed80ead7015f1caa329030bcfcde1d394","alpha-black-90":"2dce052965d27fdbbead8d79bf40e075be4f6fbc","text-quaternary":"9f18ef4a921a5f93e2ebe7dbc26685add60c884e","bg-overlay":"bedae91e10debd3369c56a3e0ddc733d4bc1e9fe","border-tertiary":"fd22ccc9e743a233ebabae4f47b3532c3977996a","text-brand-primary":"8228c772fe8f48c9dbafc47771e4cd870e8a0520","text-primary_on-brand":"f84b4915322228eb94e1f3205d7c5df149329233","text-secondary_on-brand":"f5543e9e1964c594fbc1d029821842a2fac0b92f","text-tertiary_on-brand":"6f220344e40d6e99a8a81e4c989f7ff46fc26496","bg-brand-section":"0fef03d1e04de40cb356828cd79fa192b7628a7a","bg-brand-section_subtle":"ca42dbd818b740dcea6afed204b4dbbb9c164d47","text-quaternary_on-brand":"731e74149c0c4debe91ecfdf46d843a84d45c9a1","bg-primary-solid":"8a99fa66d4da0106b39642ddf6dfe1f5732ed965","border-brand_alt":"d443ca138d568ee758a7e46a23f00c19e67629d4","border-secondary_alt":"dd27308aa2d27b03b4dc61cd83a0fa0641e7604e","fg-brand-secondary_alt":"92a61ebdef5cabc5583ebf37db73e2683c5289da","text-error-primary_hover":"4add04bc8281528a8afc45fce655cd0b105be9f1","fg-brand-secondary_hover":"4f949753e99dbd435c5179073a793a5bd99f2246","bg-error-solid_hover":"6748d55187240c1dd3260bc5476d0cee0bc332ec","text-brand-secondary_hover":"b0a839b4e6f6b25892b5b698222214934d0ef4a7"};
const SPACING = {"0":"c4cc924d3d678b2d8b24178dc53fc42b6092a35b","2":"8e15ee1816c5e1e34d819541a5768ca695a11142","4":"6ba58064ddacb8f6490756645db6154c568c33a1","6":"9c1566a1dc8c78f82ad9428c21fffef941041a95","8":"adef633b324c57f0d37763d1cea5434603b9bfd3","12":"3f43ed27e46f5d5752834b331e2e7b2df445c638","16":"daad50480ea548d338d5251b9ca418dc4660c673","20":"476e8bbce2122a160839d1775973ac1bb1f5200f","24":"e17bef678755910ee4441009c4428f812017b754","32":"2d244041abf7d0ebe6f011272abcdee64ee9cb22","40":"44156d16ac8def0144fc9eee20b5afc843149b57","48":"d6572e9ab04b80bd427f921ad1e14b54d0a7c8e4","64":"68c0b4ed6f314d9564a67153d03a65a9417028a5","80":"ec8c9b8942c8c6a20619c72e630410d100173db2","96":"8958ffc57dca95a731d39f98262e06e8d2ac7c64","128":"f8d6df1030c5f6d04ea7777ea650eb181ce2752b","160":"51ed3070451337f9cb6cb5830c5142da9d4c1cd5"};
const ICONS = {"align-bottom-01":"5624cd5f646cc272d9e64db88852b2ed39ec264a","align-bottom-02":"584874b6ae56128fa097443de221f33ddea87ac8","align-horizontal-centre-01":"25ad1785e1aea131b0a5567c6468b173019a090e","align-horizontal-centre-02":"3cc906c6c86c3e1f2f525744dbe3ecc0081e2140","align-left-01":"e67352f7ffe70a8f89917744a65f40e8e48a82e3","align-left-02":"61f33f60e835e980a1fb4925026c453c9d2d6e68","align-right-01":"afcf598ca523046594b76af7778a15a9296bc692","align-right-02":"e531aa2b08fc319d458652b0f56a55953abe0265","align-top-01":"6d83fbc63218694f2f6e0d688225711f6e304c0f","align-top-02":"5f3f5ddfc5745f549e7818a06976ebae62daac8a","align-vertical-center-01":"cca8cd438465abe9288ded510888e010ca8adafc","align-vertical-center-02":"6cf723cd6fdd194db4f698462cc84b55114769b9","columns-01":"9c5be77a6bdbc59cc0f758b6d4f014387f522b58","columns-02":"fa13531d70348794bbea2aeabc1212d927936a5f","columns-03":"d34ca86beefead99011d1f8d9e52d6cf2b3b192b","distribute-spacing-horizontal":"fff9cf8275746a0c873f7b9762f13bbc9c81718c","distribute-spacing-vertical":"903ae4567f15c69e1cb0d02f55f7d3b31cc79db8","divider":"63eac2c63fe202d4fac4585a2ceb5777d51e1205","flex-align-bottom":"a9a89f36bf62a0030fdf68bab12c487999bec30d","flex-align-left":"1795a1ca608eb82ab5a3f6e0b580d0844a886125","flex-align-right":"707396a5564494715c5bb36fc1c4562f8d54020f","flex-align-top":"798f2d6d48374f15c8145fa028635e4afa3ce755","grid-01":"1bb7b336fffd68422a7eca53c2f82faa24fd506f","grid-02":"10268934e5fe7503b9ef87a28d33a32c41adf254","grid-03":"daf738187bafa20556893426384d5dd7bfb7b930","grid-dots-blank":"f436c6f65851c204bfa4fcf289997cef30f5ac38","grid-dots-bottom":"57c17661b52eb67e5ef3047d26e6df1155bc71cc","grid-dots-horizontal-center":"1a67f6c581432ad181e9382e043b905c1a7f28cf","grid-dots-left":"28ca8d8c918d7c250ce6b913eae6092a44dd47d6","grid-dots-outer":"d03ad96b31e46574d75bdb847889c252bd153db0","grid-dots-right":"70032f281ef5a899d6584c5722c01780baf8ed97","grid-dots-top":"23dbc6cdbb3c72176e115e2d8bab3d59e12965bf","grid-dots-vertical-center":"b9748b20a35c82359722203722ae490e3b9186b5","intersect-circle":"24e55c1dc8895060f5f32347cfeb72ea2d10fa7d","intersect-square":"f3dd2143b59a104360ce3f5ba75f3fe047d1b6c9","layer-single":"e055a229e16a2ec452b758549e30566120d2fda9","layers-three-01":"e1effaeceb7fbb9f67db01227f226a50739540ce","layers-three-02":"2402a51ce67c43e314b4b9d12a29c2f74d8e1805","layers-two-01":"822c34d751c54a64c7af32acf46733ae62efdc23","layers-two-02":"bd4a5492dfd600b942998569fb14adc985f567ab","layout-alt-01":"57f688cfd67250bac039e5ef39b5e4b86bf0529a","layout-alt-02":"9d97292c4b777accf753a124d9f8cef4701028bc","layout-alt-03":"cd89d5247f2567ae1e4bd5ff45cb9c0bdc997c66","layout-alt-04":"27c2f4a52cf633eb812222cd4635a0a42df368ec","layout-bottom":"d2b8ff678fb6b7c34ac81de14014585a98ac50d5","layout-grid-01":"116b5e999ae2c5ec45226321de8202196edf3f73","layout-grid-02":"bcb911b4a9ffcc17d52f597820856a6273380b99","layout-left":"89670778bc7c3bc64ab89a1b01b0b3c1c24d7dfe","layout-right":"51953f32e286a127b2c2aca1c1f794174e1d86ab","layout-top":"6625478ba5a0b723ed9f786501610b89ae8bf581","list":"2372e677c4a49da2fe1ad806714ba33508ea53c2","maximize-01":"857e2c05a68d290243fda08040a688e74d91f3ed","maximize-02":"898966ec09b902aa5e2fe364e462d7bf3f992053","minimize-01":"c64bfcb3741695c705685ef1b43d7ac0eacc5f0b","minimize-02":"e6ee9a8ff6484568073f1dc15978dcde917e54ef","rows-01":"7af7318f9fde135b702204a2c2142ffdafac0dc9","rows-02":"9e761cbf4c4fa05a5af82d3f746ce09eb077a02a","rows-03":"e4b446b4016e864868774ca3e5da8743e6901595","spacing-height-01":"10c8d95ae6769162b12d4af1d22cae20b65de8e9","spacing-height-02":"d3298a5b2c0e791c929a8f7fe03082e1e32fe172","spacing-width-01":"a5950b7c7dc1ec6cbb3454c577cd5a06fdf25d9e","spacing-width-02":"accac43f189308acb4002ecedf439dd735dfc8cd","table":"97bfb64b08bcaa6d29df65387e3bce13128d7969","bar-chart-01":"36c06518ea7c19666cb96b49798e9c6990f9740b","bar-chart-02":"b46270a56787aaf94ad8846f0990953ec903a01a","bar-chart-03":"f57d78c99aa2597753ad11bee9856e3386cbe465","bar-chart-04":"4855dcb4a57ad5c3eacc484838317a89fbe2a8df","bar-chart-05":"63921cbea98ea472b667841745287125c4936f63","bar-chart-06":"397bdf43f2b8a5ae94293723bfdd51e9e9bea574","bar-chart-07":"5a89972405d77fc82d7b09ff56a2f43b2b72509d","bar-chart-08":"2a031fe627ab4f345461695c541654271908bc8a","bar-chart-09":"36b687e6555d5526557d32138d439363e01f0c35","bar-chart-10":"a0c68c442bd1a2361850607026b4a12f49fb0c6b","bar-chart-11":"4dbf800343b454d1ee149b5d32762e88b3e5fcaa","bar-chart-12":"bcd49794088913aeeaf9f601f9cefdadc0df44e9","bar-chart-circle-01":"72e0a8a3e444433a66b49a7413e6ff3bd36fde11","bar-chart-circle-02":"705a5fb70b0f5dcd010b2df89bc3492b022f98b4","bar-chart-circle-03":"56ff5bcb738a32d6ee66387e64f855c6aacbbd86","bar-chart-square-01":"598987e87120951d2926a9b2905dadef4df09a5c","bar-chart-square-02":"bf4b0a67c50e6817efd05f72b655fafdc0ab8ee7","bar-chart-square-03":"9f4cc8756f881ff4293539b2332c08cd46126c64","bar-chart-square-down":"8c8131748e23a3973c8209508a52a7ec5c484848","bar-chart-square-minus":"3cf7adeebac7fea9ffc34f3241786d89ddaea3ff","bar-chart-square-plus":"5395b47d5d89defb35ee4cd84e55b9f7507674f0","bar-chart-square-up":"bdd2df5a8be5496cf00d93ded5ba8ca0d76e2bae","bar-line-chart":"2520e2da223a9bd8f019cce84776041841636a59","chart-breakout-circle":"f391d74d839a99729fe261d6e66cbf366f5305ab","chart-breakout-square":"72fc883ade111db195b75c6710c7faf9d0954437","horizontal-bar-chart-01":"154d62cb46aa3517471e9876b6f66b81ea288734","horizontal-bar-chart-02":"ad177531c568254f0e20b64535d7692486f33f05","horizontal-bar-chart-03":"5a8e59139a877006d1d8f86cc557bd7daa358cfb","line-chart-down-01":"d94330143fb72b93c9ff74bf5a698bda440d6180","line-chart-down-02":"cb7ffde595e752bb34e2ba2ed3dcb58938fe67d1","line-chart-down-03":"a7dec65d376653a6fcebe7cd75f5c70cc5e84123","line-chart-down-04":"a45bfb8ebbff056e117c0cdad3b8a134c6cb4139","line-chart-down-05":"ef6eb1fc1eeae131c5a9905803d5a7209730e576","line-chart-up-01":"e70e27e092c04d1f0a05416ad5a2b59d55c6419d","line-chart-up-02":"2055e4c61e8666dd5aea383e20deeb4a3de9192e","line-chart-up-03":"b264df975c53d65f2e15f000334efdabb3b83396","line-chart-up-04":"e089fe04292e7de1fd3da903e1a0a264bd56f9b9","line-chart-up-05":"3884b9d04f46f4b34074b92c35d98e7893286ec1","pie-chart-01":"f47485c1778ea5b0beba2151d299976e5910b2c4","pie-chart-02":"39b6c6c14b93c5ae34c9a8425e28bde56d1a266d","pie-chart-03":"685d415fab28871eda689683c33c9687a48ed40a","pie-chart-04":"fce0c93bd6cfc441be3dba9e8571fe041b8390d1","presentation-chart-01":"0be77f0b77611e87760dc9e0d0dff2aeca8f8f47","presentation-chart-02":"17d798a00b5d65575088f672c084172d65c5ac52","presentation-chart-03":"37b75f3bd44cb2a363f0c054d86e24fa2d41eb60","trend-down-01":"f7ae32d47236ecc5761f2d0e13efec4b871284d6","trend-down-02":"caf6aa9b15c788f31afe288f48fbf92397623a4f","trend-up-01":"74f0fed7241a15324ff619e15e5d74108cc70e79","trend-up-02":"c0e86cd33d6a607291461cc4f60a1f97bf9fc495","face-id":"febf42c33014388d312ebbb9546a879fc5cbaea3","face-id-square":"92929e9b66dc52746b65e7cdf88f433154226708","file-lock-01":"e32700ec578e75d1fdb04387f57a22dc8bc6bb39","file-lock-02":"fe58fcb6f631e2add01121020d3d8286b3e0f136","file-lock-03":"1f02068de17689fa3c52679d8a42fc5e49eaacd9","file-shield-01":"ac0b896f6839cf2af6e0c6264069166c798b9805","file-shield-02":"54836414fb0cbb2c7a5c034b2237643c058f4f2a","file-shield-03":"7b7fe8dd5ee3ce0dd976a1b303fc6756fb4a37ed","fingerprint-01":"607648c57064f76e2ae9ea257d8d7fc1d2a2f13c","fingerprint-02":"6e50ba396684c2d89725ab91f825627b423ad320","fingerprint-03":"2eb7128262ff66df38570bc82ec6db97cb7cd0ea","fingerprint-04":"cddb1e34f5f6dca8bd92c5b1feec2d49478a8154","folder-shield":"0fd0987389a4f2b4947eed9df9417b9c9f267275","key-01":"6ca453e056f784be9264dd3291c8a5176807586c","key-02":"0ba778351163a59cd9dd86343593d9cef52b2ca2","lock-01":"4dedfead5ce0f0a9ef5f80d6f85e28ec74275c91","lock-02":"d861bbd053c9e6277b3f02dfb4c313ea7ea1bea9","lock-03":"9672415f558808cdf5583ab2d80f4fe81fca424a","lock-04":"0058d94d053dde523aef15332158077974a7af78","lock-keyhole-circle":"93de5dd7a0186314db01667b9dc15b86b6342aca","lock-keyhole-square":"43c32b306814fc35b9ec2b60577ca100333703e4","lock-unlocked-01":"9e37e50334de840de3dc1a58b3abeb5f6f9fe12f","lock-unlocked-02":"800d33bf4cf7dd098e7942053093fb268e140ea0","lock-unlocked-03":"79867ed63b6054f3288a3aa6fe83ff255f2e7957","lock-unlocked-04":"29dce33698e17213b3bc019cf8424bce8af948ec","passcode":"157df455b14cc29c5f81a0e5cf7a76eeabbf8ee6","passcode-lock":"62ff87c2995de1c0d4684643e7fd6056623cae97","scan":"466fb2c9d641e1372d98ea70916af7d6d724967e","shield-03":"d687c778d19341a685fb3229b8d66cd0ff2dc77e","shield-dollar":"7e54391dd4563a7345db61deee621ff1ecb2a056","shield-off":"860ac4b81d49331cc294d02b77444adce29d3518","shield-plus":"e93fc32f8416041c1b3c8317c31197b680acf815","shield-tick":"11c075a59bbb3c1b94c82d74b42f30e79c9ba416","shield-zap":"6458f9b8b65dc085ecc7582b72f95dd09145ef75","shield-01":"f46b1d0c679a156634a67176ea878368f91e5ac3","shield-02":"0a8c23ed8f5f86992bf737d6cd4bb893241d450f","atom-01":"d5bc2bb519ad666bc1c91cea0f34b7d32bcc2d84","atom-02":"6a099ad31d8bc28887b445fb8c450a20650654de","award-01":"89b26c86cfd09e3c634e5a6c99e1ef27daf10b3f","award-02":"f489f4ef421c39ab13ca8ae128662b5dc225241b","award-03":"b0f1a05a6f62de0a534268c800351504416aaeae","award-04":"e1baaa9883153df4cfa4620604525467f3d1cb6b","award-05":"7536c55610a43d388ed3553ff7d41e484b80144a","backpack":"fd7cac96f6e55e9b272984270df3dc61f1e83bd8","beaker-01":"3e24a691cbc1afc1a925d98b29a695bb36d0d3ca","beaker-02":"3d9f3dd978edc87ca63fade5d245bde693e3f12e","book-closed":"36c526bffcab90abbe5904e88a875bdaee05f933","book-open-01":"eaed0f571641e440820463aba1592a7bea2a6421","book-open-02":"e5860e89f1aea0d247458fccc76b6b566eb7c92c","briefcase-01":"5a8e3559d37113c7a54cd207b6ce7beb0579a782","briefcase-02":"746151420fdc7f8a7078223023120d6fd62130fb","calculator":"016409a07570d821ab2d73c124a9f02d4f4b40a6","certificate-01":"e373d8bf8794f690e06ef57728410688bbcf2774","certificate-02":"07348fa3a2c91f7a0e997c5bf3bf5443a46fbd5f","compass":"ed2139f84d30a9636f2298f835e74ea7c71d96fc","glasses-01":"8911a0b0f1cb55c9e26f8c640ff63ebc44915893","glasses-02":"c877b379e9551b07326b7f6bb5dbae78644dcdd5","globe-slated-01":"6c67fe9da5927dc725e5cdd1b70fc143045d5a2f","globe-slated-02":"0d4f0578bb63467ea5c02cbae2308eb92e92d365","graduation-hat-01":"223b990b93ec2ce224c08d2452a7f03132b1606b","graduation-hat-02":"c3310ee059cb62b3e7bd1dedc0ac735d7b7b2708","microscope":"24bc65dce29447eaa0fb6179ab0f9f1e5aaf8093","ruler":"cf8b73e79cbd52ad2bbb1def38b7661ee2b26b8f","stand":"204ba62891ac5101c76dc21bd38eaabeb2619325","telescope":"8890d99d1dd43b117d6faf4ff18f6d8a90f86cd0","trophy-01":"8f892f461e4ce17ba14df1ee01504d3978f9a034","trophy-02":"0e50ba405dd0c800cfaffb60512d768640beacf5","brackets":"bb3f8ba90a2e7c3169734a579edafd5ca0427658","brackets-check":"35f91f8cf177ad289aa61f04f980497fde5b457f","brackets-ellipses":"f01f0beea2b5e3a280b30dc8e37d41f4813db547","brackets-minus":"4e4370eede9c1f936de851ca9195672fa3045958","brackets-plus":"40a3a9a9fbf4664e62ba0bc4808f7b1eec6eb198","brackets-slash":"6d795ecc5a3fa0fc2302a9d1aa397be03aa5c32a","brackets-x":"1679ed1632f55f10fd59b6087fc7cf4d61496d8d","browser":"1a347fb4ac5993fd2ea52c8d4871c2feafa358bf","code-01":"4a79dea5baf576ea03283ad0f7fe58f31cf6fa10","code-02":"79605c00fb3c6479ed4c5ad6138454e46d01119e","code-browser":"7aaf7787e4f04a6fce842de41c1dc6cc93033480","code-circle-01":"468ccd29f612bd3941862349500a04c400681e01","code-circle-02":"01aac270d1017df624e63733f283862a86259c7b","code-circle-03":"0898a9d45781b4080fb23ddba5a9a2cf31366166","code-square-01":"a276eb457136a175bb199f60692c3531f3f69995","code-square-02":"7313803740a601ea7f995eff89efba45aca11501","codepen":"21e20f022726680c51773553d487662d06ee0124","container":"27f6cc76d12e4848a0e42ab5f83d0efd51a5f653","cpu-chip-01":"f474e0d7ab173c51c0a85e3298a770b4544a6fe7","cpu-chip-02":"ed558b128bf020cbb774a39af6eed17664b6acad","data":"a32018c23051e2e913620a4478c30742fa2c304a","database-01":"0f86d32c807fc18c92d9001c66104b30e5e6cf65","database-02":"be7cb064ee9b3068bc8d5ec6bfc5c825a9addbb0","database-03":"69b7626c8323472a7e1b9d016a5ff6195a666b24","dataflow-01":"e639ef7b32896dbdf5a00ee22b28b382b863294a","dataflow-02":"8b7e70960e84bd10dd1ed4ef3f69145600695ea6","dataflow-03":"293ea0303125ce3cff1f90d5bd8152c83f1c6f01","dataflow-04":"2337938759777455f0eb8afeee39a58c1212da58","file-code-01":"9139a9e5fa5294de51335baf95903d37f1b15d28","file-code-02":"518592fd974d8f006633a7e0a6e6e77f1a591f73","folder-code":"dc50ebc938b2465e10ec1cfde87d217a67f5bd93","git-branch-01":"6aedd659f2de9fb46a1db127851b34b0877185c1","git-branch-02":"fe2b3526c3b41b26ef26516c6a4cd2dab7ca0f36","git-commit":"f602922381c54ab1e558ea5e7fc58c31efa08385","git-merge":"ecd817b250c5a59d955d5c1c5e3e693fb7e03459","git-pull-request":"454fb40e028c7de125c9e6082794ae29810a6d8b","package":"a7e0e27fda9f2b14ef77052b4626acfcb5572e3e","package-minus":"4286872ba60d8b96be37a418333f17fdffd45e90","package-check":"e244555990c242f9d7bcac2e689ea69084f31c67","package-plus":"693d99b5288454e209a8f228003d8f7ffd589e96","package-search":"8fa80a8ab7fa305a731cfc8b4582627a9d85227d","package-x":"8048b134010a7e439c44431a0e8702b186b37c80","puzzle-piece-01":"df373580875919abe0927c23657a2a031bbee8be","puzzle-piece-02":"90809a7c44bb4288c3a3d054b7afbc42928db9c6","qr-code-01":"2cc6eaec9c92f673b5c2ab7aeec896061d5fe8a4","qr-code-02":"e28a1036b397bd2eb816f82ad21baae694546c81","server-01":"6c81f8236e4f10c641699ffb00b75c2e4b464f5a","server-02":"2cb5378eb1045e1806350ec11249cdd0a30307c0","server-03":"31747c6016d6dbd7680e27729137882afbcce641","server-04":"529f9ffc789560267822affc48885e0cc3003cc1","server-05":"df9c2476d7e1757ae3e4d3c76cbadaaf008abc93","server-06":"2ab7bf05afbd7f14200bbf05befd52b46c204407","terminal":"1bf21c6817375249d3d71b655b8fcf537c3011f5","terminal-browser":"6e9135bd262ab04c255dc8aec058e40a6d00756a","terminal-circle":"9331dbd43ccb02a78044b8e17b6950f57030483e","terminal-square":"63252fc7c07feb35af7faea77d25cc04263e4f8f","variable":"d7ee2b578eae73f2db4ae326ea452c7f9e61b439","arrow-block-down":"83f521d8e0d3f3a97c2dd9c4f1d6f1cdcf2b3c6a","arrow-block-left":"beab53816f577879cab7c521151175b744015cb7","arrow-block-right":"032dc05bbd53a1156530003e6825b01b0397243e","arrow-block-up":"f289bee8ba47d429673b032ba9e88bd913a1e93e","arrow-circle-broken-down":"f92bb37568914fb6b9a1ddd74feef841ef63c8c7","arrow-circle-broken-down-left":"f67c6095b4f4b60f2228f63a5f41559706883bff","arrow-circle-broken-down-right":"a30bc155c1451ac67d11948044481565bac9c09a","arrow-circle-broken-left":"3ab8fb5296907a052165933d2322a133f2542e4c","arrow-circle-broken-right":"1b0dd00bc4ca9b5539de8f655b6355421697ac83","arrow-circle-broken-up":"7ac002de63815e27448c4928928ae40bb9c4bacb","arrow-circle-broken-up-left":"242d8e840a312682ed3a257e1f0e84991d9e7f6f","arrow-circle-broken-up-right":"b4695554585132b9a76717e1d7ac6f06b76bad7a","arrow-circle-down":"b263c90496474d036079645b062ebb314e6659c1","arrow-circle-down-left":"d477b62ea9d6fc66d9bab307c4011426ad8caac5","arrow-circle-down-right":"85ba17d162bc1b361ad671fc03334c0b54efdcf6","arrow-circle-left":"b0b6aab1659ff9da0eb1f32215173191b7e42a35","arrow-circle-right":"9af4f789374a2c7bd4edb58e1cc21614cb68e9f6","arrow-circle-up":"074968c99675f3b6f7c903bd2f525c9fc89a5013","arrow-circle-up-left":"49092e86eb42b9a4ceeac1fe4eb41a0d8bb28062","arrow-circle-up-right":"9dccb49ac41592c83189f36b2572d96223144535","arrow-down":"f72072a8dee831e3ac09cc815b30fe648366421a","arrow-down-left":"6aeac077bf9fcb850da8a2dad8e508607cf18386","arrow-down-right":"80276044ccc40f1ec0cc1142e93aacbfeea87074","arrow-left":"75b133d1bd376f7412b250c2b1d9da1daaad84d9","arrow-narrow-down":"2763f1485b943eb3d031656919f659c15c8af7c2","arrow-narrow-down-left":"3e671fa4075fe1982f172586a950342930103571","arrow-narrow-down-right":"bfb34b06ef981e015bbce991caf69970cef37ad2","arrow-narrow-left":"b75ca4a0499936c13dbe5d0ec7417f370670d2a6","arrow-narrow-right":"7772cd024522ffe0561154fe92a6afe900f1e642","arrow-narrow-up":"57200d79d9498cdfaefb38e42c9dba7f18ad6e48","arrow-narrow-up-left":"df748e0e4e00314fe29a89922e9fcb69c0630f16","arrow-narrow-up-right":"e15b5e1ed0cb4ac28083f27caa0c903fcc2ed343","arrow-right":"893fb99d8a901c294ec2346b474b50b2d511d5be","arrow-square-down":"f20dcddf25d9c5a6cd34c979d3bb1e8575477705","arrow-square-down-left":"c8f5180995ab45fa25f38393aef80f1bd0d904d6","arrow-square-down-right":"69d7071f8334b0a3cd0f5666a00114bd6c67444c","arrow-square-left":"f9e4153e4dd63c99e58f7dd4c1d81b7f21efc8a5","arrow-square-right":"da9b4f16221a1877bb67a0527d5d2666ab082faa","arrow-square-up":"9c26c404371cb16f78cbdcc690e24775d1d58ed5","arrow-square-up-left":"289f8769851d448b0b38e52059cb8e7895f6de80","arrow-square-up-right":"f2d31302a68da89f124f35d193263b33f2d62960","arrow-up":"dda437ce6f46de8b5a974ddfc5ddcdbf3d3fbccd","arrow-up-left":"929529975fb101fc6a973210ce0e7457025473d4","arrow-up-right":"320d65961fa79ccd727763e261269b19cf1ea6d3","arrows-down":"a0b653d472d4b93f24ef3f544f663433cbd22e23","arrows-left":"3a4577aeb1d1c991149e373ccf36a358cbbcf26f","arrows-right":"90e8993c301e978f3216e2730cfb8edd35f40656","arrows-triangle":"d6a8764e43f4db63fa176da10485f1094c82b610","arrows-up":"fbfb2f85bbb481038b0ba1abbeed8366781d3cab","chevron-down":"a6f3bc1c21e335b030a60a40ffcd2f74d85e5d79","chevron-down-double":"57fcec6ce53882c1c4943782e2798f30a0e3ed4d","chevron-left":"951d515335b0645dcb19abeda1842614895883c0","chevron-left-double":"018c24703823383002969b29d29c514cbf57cc6b","chevron-right":"a006163646c2451318fc7dcda8c0ca4b1d6e1e02","chevron-right-double":"e7278898b78e81a6978ce9d01249925a9650da49","chevron-selector-horizontal":"49722a2cad9b4c0c3e555ac626eb33fa2bed88e4","chevron-selector-vertical":"e25e430f222a9446e3d7e9a480be905ef3908d89","chevron-up":"01f7081f123a45014edd3a33ae2b08e8ce5e171e","chevron-up-double":"24fd5bacf43fa4512b2a1b004ef4494afe7ac6c1","corner-down-left":"c60a52dd281d291b40ee81d83ec464b0ffc76e5e","corner-down-right":"a3bc39847d39d6a842fe796a6d372691d047ed8d","corner-left-down":"cef8fd1d93791afcf4e2789d096a62ab1aee5fa6","corner-left-up":"f434b073c1ac3e9bc9da10839717d4d8a8b84ede","corner-right-down":"a00ef2a324d56c92012b4a020ac8d3f8ae48a302","corner-right-up":"169c3cadca285ca9005b057907e0de78ce2a44f7","corner-up-left":"d27e6689ea11db634d2942112956fae7ef102da8","corner-up-right":"c1af0b8a53e0f86c5db67599affa1629fa48f3cf","expand-01":"342fb99aa8bab789a3cfe011d92d5942ffae3570","expand-02":"d041f416d4ef0fe6ff69c79f8d4edf2911e6e311","expand-03":"00e266842af0c5cacef12940d866f528d14f6d76","expand-04":"bb13a6c2a40ae7fc2ed04967e4f48fe2d0dd7d8c","expand-05":"22ea4b94c92e5b335a1d4ba5592af061fada7285","expand-06":"4d2a1cc34ac9c69bc4ef4a9157072393fa62b33c","flip-backward":"a20ac9f4d6aa8902ac4297c3eeef593b5e451a50","flip-forward":"c433a7e6b38ecbbc2c4f9c4d035de39a32125844","infinity":"13ffcffbf908b1f51576a774c1f583a623541482","refresh-ccw-01":"d57a8e5521e68e01601643d3969495140b1eaa17","refresh-ccw-02":"024439decd7e7f5a189a587288a7152a080ab330","refresh-ccw-03":"f81bc0011d0aa3e080b25eaa90e2eb1f1eed26a7","refresh-ccw-04":"74846c93d5ba593096e760f900f7758e085d4638","refresh-ccw-05":"d5faec557c2c68fb82a6531156f75dfd6d2b40ce","refresh-cw-01":"81ba1446eefd8105fcc8e1671b2f08d9871b161f","refresh-cw-02":"49d7297c2cf48e3ef99b471f704ed0e4908299f0","refresh-cw-03":"779eb241980ade5b9f29b6b9b85919e494bbc3c8","refresh-cw-04":"0f06e516ae0ec1b0b0af9dd03cd3fc670141cd55","refresh-cw-05":"a0f573038283db5693c2f9047c793db9ba6e9deb","reverse-left":"db68f560030062df42757612648604bb8e3a9779","reverse-right":"966031363460c4c5e953b2f934c1f6031b22bdba","switch-horizontal-01":"10c5ff10ce32ed99e39792568116deefd78ec9f0","switch-horizontal-02":"09fbe626418db8bdf1437c4168a3dffa12409d2c","switch-vertical-01":"4e471aee8d737d6c5a39404c4f60f3ce49acd6aa","switch-vertical-02":"0894c9d846c98118937825bd3e18e1cace1f0f84","bank":"900b3af9e4d67aef4b822f26f6968d2bc702823f","bank-note-01":"1ffd1d8aed02c2d2958da7ce8859f777dd25c173","bank-note-02":"b01d8e6ba543fc4378969a7ffa65413ea18e32c0","bank-note-03":"ab911c43fc39c1d65541b7b61eeef3fe81d4ab1d","coins-01":"c21dad5f67946b536adc9113443441654b3b8006","coins-02":"7584e59d70e35928a3cf5fdb87da654974d198ee","coins-03":"74915d59b37c1f93bb26eaace22fb5865a33aeb9","coins-04":"28ab624ee0ee86afdf4e15e087ee4ed87a396385","coins-hand":"4c25cb39c1689d62384d80b112534818b7f92cd4","coins-stacked-01":"a8a7d5da10abbdc19f7dca794daf0bb0b0eb35a3","coins-stacked-02":"cba377b64c9e2d675aa3d41f7fc5fe18c5407656","coins-stacked-03":"d73f21944b119022de0c7336d871ea2d73296ddc","coins-stacked-04":"3b482738884dd1fb76a9a81e676eac56f689f5ef","coins-swap-01":"8a0c0d5dc928f636b9166067f3f512cded1c8781","coins-swap-02":"c47cda82438b48129a96907683307c60e1038672","credit-card-01":"96c929ccfc7c3eecac1c341f133a9f59f1022229","credit-card-02":"8446deef1d0b71b754281d2b2e28de307d365b37","credit-card-check":"e18d8d59157c6071e22a619075fc97b144229414","credit-card-down":"bf6af47dc643e072068c46d2d426ce4904733d1e","credit-card-download":"f6636cc0889b7aac0f0651aae2d0ff11abb177ea","credit-card-edit":"de5017f8c7db87dde66bf26a9c9992a0835e6cb5","credit-card-lock":"07018c6c2fddee9dfb7869d8b60e05847b96916f","credit-card-minus":"003e5268a2f96e4d867c7a97a790b0f43ebefd6d","credit-card-plus":"6eb3514543579aa91334205dda1ed55782ae8515","credit-card-refresh":"ab8f98d66c4a46f00046270f0921601d5b7053c7","credit-card-search":"da7075016ca5d0a9e9fdeba84e5917141ae8168e","credit-card-shield":"26de19ee4a1aa25dfcd42cdde65bf765e0d76a3d","credit-card-up":"90c69da3ec2c8318f2cf7baf33bb7dd025e68780","credit-card-upload":"14174438611ce066c778f053af7cb71c8b8547ba","credit-card-x":"e852da29cf012beaccbce9af58874da3169f27cb","cryptocurrency-01":"3b7e4d50d088e1e3204b36273ba86ec0e9477f86","cryptocurrency-02":"760b8d6f8351d613d74cd244f65daf554f871e04","cryptocurrency-03":"bec61c7b80e8ac575a56c2c3851d7433c62e36a2","cryptocurrency-04":"a91a17dad87e35803ddce9683a623f30c22ec96e","currency-bitcoin":"68a9a18b212fdf0724849326d95b9c9828858256","currency-bitcoin-circle":"e4ffadc2dc78a4c55e25f1b0ccc98d7a180e66b2","currency-dollar":"d5b536a4b3db00307db02d601b702fa512359901","currency-dollar-circle":"81413673fae56f46c7cf46b94fc18100584fc132","currency-ethereum":"1d66f48dfc8ec7e47288cd4ee9ce37e082ee2412","currency-ethereum-circle":"5bbfa0d42bb90e289a0beb515655599be1a37acd","currency-euro":"6c2813730d77f9978d82a88915a6dbdfc7ff2f7d","currency-euro-circle":"fd4c35533d62a579568c42accf87adf99756e96e","currency-pound":"170564aa02300f1211c438cb6103a05a2507fdf9","currency-pound-circle":"0786b00fe32a044ce5f642350ae8f5b725de6e8e","currency-ruble":"cfbbb41b483af444576318ecc84d85d0b3c13748","currency-ruble-circle":"4732c871f8256b075837820dfe8aa3004e08b472","currency-rupee-circle":"e117a32cff2c1634a3ba3fde4876319b35acd874","currency-rupee":"ec36ea6053dcfc0ca29322091564d9e6b071c996","currency-yen":"b9bc0c4bd3c028d0c52ed89c48a4674f2e35a091","currency-yen-circle":"836a95763b4f60e3f780a072d84af8bbd7d2c312","diamond-01":"8bd2eba2d1619a05b1029cb6eac8638d503bc0f7","diamond-02":"7d1ce2c33d80f75f094a4730cecbc9a881f95a48","gift-01":"2c832ce1d4e2637b8a89fac0ff2a7a2508f42fd5","gift-02":"a864f604b3599c716149c1901bf0e594f098b09c","piggy-bank-01":"54b3bda4ef3c079d514c69dfcf0ee1b2cde7734f","piggy-bank-02":"09e2c53fdb8d79d32ef90a95b35a736e88428781","receipt":"d99445a3bd02f9e04e9e97485f29cb412967a920","receipt-check":"6cd10dffcd8e953da0b90a2b39a0733bb5673e96","safe":"3b5d77b0712ea128fbd7117f50906af7654ea9be","sale-01":"58f34919b5a41befc8d5d5dff6779a93a067844a","sale-02":"134cfced766de6b024eb950bd457b1fc2f8e39e5","sale-03":"d418a6cf4532fb3144c530d9654fe6d5eb1c11d4","sale-04":"de0494c49197b0b857a743817557a7f2a61dc38a","scales-01":"c76ad6b6f13626ba899fba0c8232e9085c145ce3","scales-02":"59ecf96039007e4b2c82073b7edd7087fdec2957","shopping-bag-01":"d98199bd35d8f35f36ea2179896efd22c5a2f8ac","shopping-bag-02":"1bcac25ed6c802018e0d982886f3a5c331660d16","shopping-bag-03":"1b3591aea485623b6e28a9a12ef40dc2bb594e3d","shopping-cart-01":"fd2baef020e164ad59d8ef079050173c8c5c69dd","shopping-cart-02":"c0250f3a08361c11c9c508be89bc1d87356e292c","shopping-cart-03":"22c54f005e0e1eb5b6d50412fedec6448b50a8b8","tag-01":"b23e437811d9e31ac9ba28d0af853b9de6d0c4b2","tag-02":"394ef9c1ae56956fa8bfde0652fcec236ef5d679","tag-03":"b115d4fbd97d77af2ae6309106f1906e3fdfd12d","wallet-01":"baff00de10d69450ae8c6209963819d5f8cef4b3","wallet-02":"18d3f85a9e45df471d5676880c14914a54548f63","wallet-03":"0cdb455d23bdb15adb4c043269ac9d1bcb30cf97","wallet-04":"7a5fb29f863ddcdcdfef65eb3d4da7411cf5625b","wallet-05":"5eea1b3f36283494833334ac48fb14490712beb8","activity":"df8456bcef5c765a7a21451c17683e24f0ccdb0c","activity-heart":"d0ae197429d30f8fcbcda26bf8d58c34c4de1123","anchor":"c2279810f3f7e0270910c99716850703b59fe19c","archive":"b4138db1c1ea7f61b71529463be8f195d98789e1","asterisk-01":"52399b3643af3fe5bc825d42dcab72ee7e4666cf","asterisk-02":"78621c901b9f09e0fd4f0735ecfdb43a38d03879","at-sign":"817a362764bd8f56f1200b9eb61714eb7b3b36ac","bookmark":"1eacc92a6c9d2ac0b8fc999d33109748776d47c4","bookmark-add":"692efc45d7cf9e50f23ae5f7be9775946b7f5b35","bookmark-check":"6599e407a4f65d8678a1ceab9a81ce618e6a35da","bookmark-minus":"7802530b539d333334fa4f6753ed93f4e471c0a7","bookmark-x":"e0d319fdac4c00ea04e329817c1cdc206efdeb5a","building-01":"3da2e1c44e3ac57e213e94b3139349472a276598","building-02":"72e9d71b7ed2a644e4cfdba8c983e0f19d91b645","building-03":"09612afce532a37684469a4f38c8b40a1435c2dd","building-04":"3cceb9de39cb711a03bb2aac574649da7c73d9d5","building-05":"ea041dfbe8d15b8d80b3d7bac93e4b4686f19906","building-06":"05507dd7914b6145e1f178da389fa268761002d6","building-07":"bad3fc685a340886ec6f1bb54cfc0f9ef8fb0432","building-08":"88e357ebe008ee193a4b4841a313c2ab335cb289","check":"c856ccca4de605e34edb104d5c73f862a65ccdef","check-circle":"0fff588a262832c4db65cc6c5c9b7a5eb1825ef1","check-circle-broken":"65756bcb44f0f7a0dd0a2a002b0d80b0833d99b8","check-done-01":"7c2de57acdc9c738e5605c3e670354df37280cf8","check-done-02":"c8d9973c7328c8ea71ddaa1c2cac567a0475b256","check-heart":"0f5f781422073a8d0307bf1a9d2e5ee2350ff1b9","check-square":"ed962e2a6ce2970f7e4b9d33f2ba7d7e5e5309fc","check-square-broken":"ee84219431dea11aec7e71768d3e8ae5d20e7642","check-verified-01":"4ca71cf1a150600bb255141f55940ce094632a10","check-verified-02":"533b0d1075baf1c6608c83d16bf8b482a7cc9988","check-verified-03":"c97200122ecd3e9e139b3d40639dd961b9ed9bc9","cloud-blank-01":"9fba0aa4bb109b1e852c0421d80f3eb1608cb61c","cloud-blank-02":"91962a8de62a62ebf5d0ca435dbbca2706f0f3a3","copy-01":"b670354beefdd213a8dc60afe58ab2d6c0f14542","copy-02":"89d6a7cbf360ed00ff697e730e439eeaa96d9f1c","copy-03":"19c1a4412ac22f7e04e8552add0be8b9c48d7a53","copy-04":"f7ffa90fb16f5b7e99a7af76bb81b5625c802bc5","copy-05":"53b0a685abc503301330bb8897544188a943b5de","copy-06":"2536f9e4e30787d099cf98724b2a00b56a986ba2","copy-07":"d3ad06214cc5521fec629d35ea2ccc56aa4226a2","divide-01":"e3e873a86fd02a4cd61064fb76530d0aea52f2ca","divide-02":"ba3a6abc44f6a0696d8091e435a3bd8a19648e11","divide-03":"57d4cfe52f745b08cd849767f8539b59ec172788","dots-grid":"f75712a3914d7836ea1a2d8b0ea0885ff6315f85","dots-horizontal":"1bf58895ba09f4a2cd2ecf62aae8e281d9c5bf05","dots-vertical":"eb10a972034a6f5ee4503b224a4fcc0f835e6ebb","download-01":"379475be5ca6c0979f67be533010f3ea5481e42f","download-02":"bf9dac65243435117cbcac0d93b3866cbd524df4","download-03":"2fa59b437e4fb96e9ee454ecf351d636067effbe","share-04":"68d3d12ab850a1bb10a44c583d50c7abe5734941","share-05":"63b7d9e2b754687ee685f65be054254f87fb3897","share-06":"7f5fb5e2d0e36aeec9ab6350fa7dd71177d67c5f","share-07":"97a3296d47ff5120a51bcd8f8cc15d6765703526","slash-circle-01":"3b6dd2b943824f18550f94ad47bf89643e27cd99","slash-circle-02":"d465f36cdff2c55cdbb94d8098b6270cb6cca59d","slash-divider":"d1c427c88f5e23e3f10a96c43458b7cbfeaa7e54","slash-octagon":"2a4a76e5875c5f62191a481b79d6136846be3702","speedometer-01":"6949be06961a123c48c1567c8bd2a44ebee0dcda","speedometer-02":"2d01981c4bcd24c336943c90d2775fead2713ebc","speedometer-03":"a7ab5afc708ca305bad71b1a0d26ebd8d9d4000f","speedometer-04":"a53597633b860ad83ad38a96d5fbd681c24c19c6","target-01":"59197882a5141213f324b93f33fd198aa65f9f8a","target-02":"dfd474dd9adb905bda64d55862dc140edde8fbed","target-03":"7e5a937b8b23fd541f61e9d7a8bb2c081d184432","target-04":"fe61d249398774f89f48bf558f20f12646d500a0","target-05":"38397f93a68a8037017cf265e3c39170f936a6f6","toggle-01-left":"b5cbf24dedb89fefbecd59833d602dc15a8b7c56","toggle-01-right":"0efa6ecdf5bfd548914c0e433288a49933194be6","toggle-02-left":"ad13f6e00aa08af2558e696174642b15cf4031bf","toggle-02-right":"2c2297e2d2ab6fd7073e128f93d282761f09d74c","toggle-03-left":"d2aaf5311c89ac666d454fc593678869aa96e622","toggle-03-right":"573550c7f9ea8d15a27661c2208d7994ff3b8a09","tool-01":"4b5a729532788782b5f1e9218453f362c26998b0","tool-02":"4eedfc5b8d0b1da9a5b6b898633d3fde8080bb8c","translate-01":"6dd91a585eaeb16281233494c11296a4e7e8bea2","translate-02":"c769575689c7adafeaa9c8cca39d65b9c94b2141","trash-01":"ab5821b23404d9cb79e0d2fdb83167259275b590","trash-02":"a5db3a5fa29d74d12c9886815ab89bbd6233e364","trash-03":"5d14a239b320cd724d7d8b7b00118e52327fa0ce","trash-04":"79a13f24a0b2720ee4eea1bcab8a27f703e83a58","upload-01":"e6391f4e4ef4b9e6877eaa2908aaa45da10b8719","upload-02":"ce9b8fc1ca27debb21b6bde8cfde848479a8ad2b","upload-03":"3dd69db38beda853792fbb48f02e53a163b9b8f0","upload-04":"c810784093eab219f8accdd7f0c758b9376f201e","upload-cloud-01":"878718bd6c36464aeb4333afa7a834baca3effdc","upload-cloud-02":"71390955aafd7de082d9d7a1514e9cb4544e775b","virus":"19010cfde1e88947cfae7f68b620a960aa8c2acd","x-circle":"ec65177fb66667872a699f94eb226bc68d8c15d6","x-close":"1ed9f91c3fcdcbadf52f791ba1db4cd674e1452d","x":"a3e4357aa641250c830ab2a5819a5958890d80c3","x-square":"939f357fd106a2ba04bfaf8a20fd5be627348619","zap":"b9a11f5206c8149a55e9685e0f9dde290c9a1247","zap-circle":"e7077176b45a9c7db0e3771c8caca557c9bbd64c","zap-fast":"6e304bfbeaec32ac846ae9e3b6b184fba0d036ca","zap-off":"cd1326dcbd8427bea6dda80c54040c576ba5fbf1","zap-square":"89c499c89577093227f2f7c16b7fa325b53fbd84","link-broken-01":"0a961d91712648dab675a9148b6a56c03fe504b0","link-broken-02":"6c85f651469d0813e47b06662dfdcbf9450ac005","link-external-01":"9737768544f11a520aac9ae0a292b9c61812fbd9","link-external-02":"0d63324a22dc242cafa7003973b11932d78b563c","loading-01":"4349589c449a5111e26aab874ce6f8dc3930f912","loading-02":"269a497077ba8a51fcca403424976f838d866c97","loading-03":"b949847aefb0819de97754352aa6e78a79b12f75","log-in-01":"a8e02e369a5fc53a06066c14a0d1e90357140984","log-in-02":"938a571dd1bb622c9c269147b301a46c10a62a75","log-in-03":"7f3b0d60a1635dea7313a909ba71917ca8a6a50d","log-in-04":"f6202634d54e9c62e34aecdac4f62f8cc9726e86","log-out-01":"09719aeab9b46f7f8cc71df5f5bc45044e198f30","log-out-02":"34bb4c7ccec74f7ba15449d0b23240ee6a622130","log-out-03":"6b75278c60740f8e6135bc2c6f037fa01003457a","log-out-04":"3fae011af9dc587fb3a1d85547d3233d228ef21f","medical-circle":"dfc0402719fa8b7d5478440ab78f9fa202b645c5","medical-cross":"edf1d740611d9ab8ee0784efe23ebfdd752e0b64","medical-square":"2a0035130ff3ccd6e72264084a06a92d1e98feb8","menu-01":"a42ec42295ef64f85821acf1b0760c3039efa5a8","menu-02":"5a4d70df4b1b3d37787c4b8057ac977332432b47","menu-03":"53d53b0c92c4aa807ed4da33c5d404ca684ee6a6","menu-04":"7d1c9acbbcaaa1ce8607409c6d353273a749929a","menu-05":"4771b86f856ef535248d9362829609c3f37b6854","minus":"65c52ba7b9bd6b882dbfc5c3434c633362a8377d","minus-circle":"7191fc7cc88eba879763def505fe8858e57e3e83","minus-square":"f7eed21126d87f391092195adf86f706083f88b4","percent-01":"fd48c7a0fd99020f53086d52dbe28f4481a96226","percent-02":"d28616f8bc5fca3fd246e067dfdb0363e3955dea","percent-03":"b805b1d4647e4c7197559d5fc33a267e53303f59","pin-01":"1454a7323f5dd0e63794a6cbe82eebde31e3aaaf","pin-02":"c3dd6250610b5bfa2764c0280e524ade35538f73","plus":"1c6d7d0feca14facacfadffa9943e930673da5b1","placeholder":"88ebd634ed0cbcfc348dea0cac5801366f0b4f4a","plus-circle":"9bc592f96ee811a68df74a688909ecfac9b529a5","plus-square":"f2c14f0d741fc0c7523524d6acb4e46e594da20f","save-01":"28e7e94449e73ef5f9b459f43d701a677e0c2ae4","save-02":"794725c5a2f31a305f087685bfc3cb9e6c54da61","save-03":"6546e9040a10d1eb05eaf5230393c613ea0847c6","search-lg":"09d6e04fbccbeebb1442674663c44ab089a868dc","search-md":"cb774d0615a517aa55317eb0657a3cdef69d159b","search-refraction":"59e8e0d494fdcd449e4be4b6a7eaecc5bbfd6b7f","search-sm":"ab46ffb6745feb3b2e7a302735244217bf624072","settings-01":"fdba2fd57781d4324a44b1a2135d992f75f7fcbe","settings-02":"6981a655764cc00741bde201db38aca503477bc0","settings-03":"6f5f32113a720e82537aaba9f3e94e06dd0c8c95","settings-04":"4c7fb9d533fa8f570d2b6baaae383bc6acea5ab1","share-01":"3c8168bf29a2a98ecf14e969c9ab7a23a073114e","share-02":"ea6506b450fd25adc1ebe3538def999e207a9bd4","share-03":"408ebc31c127334627c38cbe3fd543704c459408","download-04":"dd0b08194a175cd9d5837247afe8a73ea2e9a79e","download-cloud-01":"a9864c0e83bf509388a1445a83c700e851b6fdd1","download-cloud-02":"0e3e878d7b4ec181ce4fc2688623a30804812fca","edit-01":"fb85130ebb66605f211d1ef950963d111ea67c90","edit-02":"dcd97bb8061e7996697447046db26cd4beb32fd7","edit-03":"1b5729255886e065c642a8b68a8060016031b12f","edit-04":"ada9c5fc4c8ca465365733b8f047fd9874977b0e","edit-05":"37ae91b7abbed4d49f8884e42ce872f3ee484bb5","equal":"9beba8d21919f21edad5ab7d99c593231b1a817b","equal-not":"95af6115b7339d6c885c3c76fa1d6f78ba06715c","eye":"7c7ff1ad10c7e4985a26055f39c45d43f3860518","eye-off":"5874ec79eef7e38cf3e948ea5717eb4626261927","filter-funnel-01":"83e7c9a2730697fb08ab8cef0e325b497982f98a","filter-funnel-02":"2c63e757917499d738bbc6fa93dd1c29978f8bd4","filter-lines":"9abb84b78bbd0a82f3ba8ba3631f3b61526075ba","google-chrome":"ea0ef1a43eafcc96a851852b7f06ce18973d4869","hash-01":"91abb1a4ab20e91ef08d806bd95b71b9662e9119","hash-02":"2a36ceecdbccbf629fa363302765d2c258e7a595","heart":"ec55d23f71878d627d1787fa2de249b080d8693b","heart-circle":"3f3efc730b7d664eac9eb510329fe3b5d9aa0dc7","heart-hand":"35177c0fb7d3a641d90a21021c62503df5f537f1","heart-hexagon":"eb4a70ff8979526161d674e538d31591f9370658","heart-octagon":"b665719243fb0c3d31034f85155a92fd742e390a","heart-rounded":"457ef73c3f88faaaf784b47c71b9fa4978794e42","heart-square":"427e45a84b8e4b23f99ec75717e1b763413274a8","hearts":"fd7480b2ebc99d885c29f157a20ca2e1981b595f","help-circle":"b2b5de0bad6a12262572507d7079379c3bd79943","help-hexagon":"1d82e33fa38c3699795962aa8887510371bc8ae0","help-octagon":"14797ea7205a513fd466fee98b81e60295158898","help-square":"32884d52e99a9fdb2e320d80247af200d38537ae","home-01":"67e9dcfa997b4e44357fd403e369f8f4859f5632","home-02":"e7fbd2fe500127928f8ae599abfc40bb577d8137","home-03":"cc4901e00f6ce474536a97595cb03685ee5d0616","home-04":"b215bbc19150c30a9e9fd8b860a9af6e86aee0e7","home-05":"403092755c7ca137cdf92420b8a2520d101c0fb1","home-line":"e707518b358d13d4345dfc0810b5ddc75ed3a315","home-smile":"b55e4ca0b33882ce715721cf34ad34a2ef225823","info-circle":"887dbc0af83c3523c899a979924abf4eff056615","info-hexagon":"fb0ec405534390d22b934af7d6f04897e7d326d0","info-octagon":"f13c117197a1b0c30ee7dfaff97ef3995883ed54","info-square":"302983c6fb1aa50451bc7816a163c03a45a38261","life-buoy-01":"eb82befe86b076ffec1795c51bf82a8e92b4e4de","life-buoy-02":"2fe4ca66e4e1114ac50f1db0cd6536d51d91b280","link-01":"c799d979dc8ffbefefb4908946cb40821fa929bc","link-02":"b79ab17e854a048bd8bf35f536275f56ad3cfe32","link-03":"53b26ba75d59050cec83c94df541e94aa9e179f4","link-04":"2343d148ac0930e17efdc99f3b88a4170e954272","link-05":"8551d481403fbf02ee31fa690a0dbb485a33aa4b","alert-circle":"397170c037784b6cd6e0014a1ccd0c02abb9eaf7","alert-hexagon":"6ccf1f41b9f1b03c066eb25a9332323782354e10","alert-octagon":"264dfce02a0dd52e7b2695086a3120247aab5aed","alert-square":"9617badd2f90c8bbd33b98cea60f872db8172717","alert-triangle":"bb19b4a3af3888444f97063b757ddd894acd4f72","announcement-01":"2f5ae11b9f458584ada283f94bb472a455ab3f2b","announcement-02":"6a15b02a92ffce3443cf7d3e856dc4b13024ba6c","announcement-03":"7fbf74c77ec7334d4d876527110a26a2ba145d28","bell-01":"495b344e29bc1d30a8c92225f807806fb8995895","bell-02":"788ceffed2bc1bc12dbfdf7d4a38e2ae938e1594","bell-03":"2e482f52bd4b53030cc0e44a9b0e5951ed293408","bell-04":"5524163088d579586176dc6626a0b7ecdf7813be","bell-minus":"1804cb99b672f1c3cac9b7d2cf16d3a11d9d8a1d","bell-off-01":"c003cbaab5b01e884466f9d83845e0a9f8093260","bell-off-02":"e93c4b8b886e75e76f1daa9aa880aeaeeecf56cd","bell-off-03":"b7444a3b52d1b9c7adbd2c4f2f56acad0c3893a5","bell-plus":"1db061521182f673cc7f1d1d965e49c7d25d952c","bell-ringing-01":"4dba66eb9db0f50975282a3bc4233f5fc8532a52","bell-ringing-02":"ba44f52335e7cacc04f366c1364b02b98ef678a8","bell-ringing-03":"5e6870d2d05c6f37caceae8468a8cc0f8d521950","bell-ringing-04":"88db78a9c9fe73040d9b4e731a9038ecdcaf0fe5","notification-box":"42ec13defa3b99bf370547fa7fb5f780a40716bf","notification-message":"f64a92677a0d38c84852cfcf931988cdb9688afd","notification-text":"ee01c923e90ad664e5e28b1367b8dfa43efc338b","thumbs-down":"27367b7e82724b1b399599351e4b1d5acf4fae08","thumbs-up":"7635c3eb4586e65bc57f29d91d30b8f9b05fd7ca","circle":"76d342851279d9b1355a6a7161e086817a6e81d1","cube-01":"195517883f747b7aec222d86662a42d8f596c5a3","cube-02":"1733882b5e77ecd8d1bf0cdbc70a235a51959548","cube-03":"89ff53a84110c2127fd5a19cd1a5ae982ca4d26c","cube-04":"7cb73b64c7fb2d68b82baf2f35b4b76d7f669f0d","cube-outline":"944dc00c532c9e60343734cda1411dd76e40333e","dice-1":"b8ab5f28c4b0315202c57ef80b3a2e9853fa56cb","dice-2":"5e5e3bbb53bbaa1fc12c17f942737aa37fe60da0","dice-4":"46a2eac344718512364fba32410bf6b2253da21b","dice-3":"76fea462d7787f331ddbff0c9745ea46ed8be773","dice-5":"c1be06ba97ebfde4e82e836195b9bbc3e2fb5e4d","dice-6":"4b01ed645f5e153a16ac319b1b8c6f6260344740","hexagon-01":"3d94e5bcec853ab9c456230172f919928d59261b","hexagon-02":"d0b97d3744fc2c362eded1b5ca9d81b6c60b91fa","octagon":"e7a646f14e4916571b1d1a388a59131e58d68855","pentagon":"063e80dd8216611a7e0584fa196c4893312b3b33","square":"401f6179c700dc6d2948c5220db18664fe75c7d2","star-01":"c6f973c8c7b2ecf92264da068ff717be82cdca7b","star-02":"bc9df5aa9e181809ef75c21f5ad5ce56824840df","star-03":"f81b7814e4648075840ff16b95542101090b673a","star-04":"f5e38754a919080315ffa4c22fcaf2e4edd7f84c","star-05":"871e092ff0958849416256f1b211f29ac65a4208","star-06":"ba9e10d98f9f5ef793c8d15129d781d9587942c0","star-07":"83c4a744f5f605699268aa0c314e0c698a09b6ed","triangle":"a87e206175e203b1a49463d6bb395b39ac6ee25a","face-content":"81d95870c2222df73ed6086a9063e875aa309bd9","face-frown":"9b838481fc865de784124c2bfd92d3127568de33","face-happy":"cd301e6989cd3db8ba16d86cd08b2820ae136392","face-neutral":"24bd06ebc30b6543228510400e930009710f9853","face-sad":"3719faadcc89caa5eb8f2c7ed21bf209ce878dab","face-smile":"af51b2a39cf9a2b823023fbafdb8654a14709640","face-wink":"8661ca2cc262164363bc26a1a580f2d2f8afdf79","user-01":"bd5cd50ca4ac7ead758be5d229b46c58ceb82343","user-02":"59fbc6469da8c010a83bfe0ddfdb12187a6f1c26","users-03":"ca6980d44ac9aae761bde519e3a9baa57a8db098","user-03":"f9a8d3ecbf0fb8abb79052efb3e1b1874abd5c4c","users-02":"486d58bae3cd56922530214250844f935356760b","user-check-01":"dd61ed1bed8b53c0577b1c17381579fc35e7c8a2","user-check-02":"ca4f3d293135a2a4e2c51828567e633026bf2eb4","user-circle":"3634be99ab67989ba088434a7b798101c6f95fb6","user-down-01":"a8268b50a69d92f92d6136ed296e41ba8e3ef1c2","user-down-02":"42df91cbee4ef8044b2923bf348da480572d544a","user-edit":"c4ba4821bba47e9b6df593c03f129017bb070c7a","user-left-01":"cce9f3c27f39b23558053e9639f7963f67962dba","user-left-02":"5e9735ad5afe7158dfca798033d87a322cfbacdb","user-minus-01":"8d7fa8ff30422c6d0a5d4659e503350256f8e008","user-minus-02":"3e03add104c2d4e0fbbf8dfc578534b1ce739c91","user-plus-01":"0f2e8225ab510f0745293027f793b165d3ad9b8c","user-plus-02":"09d85ba08be75501e337e13ac6eb4b866935ed01","user-right-01":"3c1d4762c5b9f58f3194de8166d90d4b8e1ed0e9","user-right-02":"43c60aa0d7f814e035dfeef32e248acf64221664","user-square":"2ea6a3fac8b26682dbeecf7c918c960fb0974e7f","user-up-01":"6394fd9052f041f6dc89c145954528a778049bdd","user-up-02":"661f841c5e68fe3578695d16b101d7e6e75a520d","user-x-01":"e166a59316a9079bf21117467db2d9d684805477","user-x-02":"0bac994c2f2889c2b34f1a610208f1959b847535","users-01":"954e0fa3ad887fdda8cd03308633cd12a5b2d7eb","users-check":"b2ca009c7c259ff3f706bd01226601d90ff4dc99","users-down":"7da46c84e77b9dcf87b93583c79d2e91f6030c1a","users-edit":"67912d1cb40189493a0ecf88703e19e8866f76dd","users-left":"afe1c1b28405da7bd0bdd5b9a7b81ea33051785a","users-minus":"74b41834a819a16f6f8c208131343b07525cdd48","users-plus":"0462d72cfa32144997aed3d7686a51bbc5de0974","users-right":"e554ad818d136e614fd972b69db5ded74ba2e71d","users-up":"29e61a7c68f5080f5277b3ba9a7d8c1d3feb22aa","users-x":"3d39c0d83e3e7654e32dbb911b609f20a42b5066","airplay":"e637d354c5a272a205655cf8bc78915bd8235c17","airpods":"2e9bd348f32e6f0f22581023fbd0ae075e7dfc67","battery-charging-01":"84997d4b81675fb96fd8301e8d9da3e22ecdcf02","battery-charging-02":"d771a5b56400bc0a2efb822d79698c508535680d","battery-empty":"54a559988ede8c5eb4f36ab56b8d8a0cff2c95c6","battery-full":"113b80a2503093e136a6b4389f857a33703eae48","battery-low":"327cb4064a56637d3af0bf25840ffda90b4a667d","battery-mid":"a96a0a05aede3b4857eda519bba7d721f41d7dd2","bluetooth-connect":"fa8e5c6ebc8f8088cb0a90ec2cf8a82f2f15de35","bluetooth-off":"ddd3ecbd628062cb5e37616c755168b30d292205","bluetooth-on":"0ab10cf3b0a9468c752a5136017c12d78bfdaf89","bluetooth-signal":"97375d98367701414b6142270788d95a392a7a33","chrome-cast":"cd1acfb09c5f7b06dd9c3f1e96b829239005d72a","clapperboard":"9f85bd991f1c28be581d535631b8f3e24ea6359e","disc-01":"5a2f6ce3e9fbd349d85e0d92a44c20f3c936f4ff","disc-02":"9a81a765816b3842d3cfccb724e89b96a20f91a9","fast-backward":"d17bfc98e0082c7c89fa3807c2c63360afcd4be2","fast-forward":"1f92b000c172c14d89e951646490ad43423d6efd","film-01":"058cad0424f8d244a474fc92a4f2d571dcc38962","film-02":"ce566c29f02142bd833705fa03a1317778cedb82","film-03":"22824fe9284206dc140d8a10f9dc92497a3096ec","gaming-pad-01":"b54f390aacf7c5dfe5815c62c4817923ed691523","gaming-pad-02":"22daee70ccfc038c43bb03b74f544d2afa91cc31","hard-drive":"5febc3bfa5a9b6a9d91864c033f5a8b02098cf88","headphones-01":"9786ac9ea4c40ca6f0ba1f9f65cee5ff75efd3c0","headphones-02":"11eab2ea5a196f5ccab6bca8f00196e43f416d32","keyboard-01":"0124b43408c14a6a9b23719531430055b787d9e2","keyboard-02":"e70993cfbafff35ffc033cec5f38af6046ebb034","laptop-01":"7d63fe22b6d7ed76ac11f2138e1d29a969ef83dd","laptop-02":"ae0358c642f271d9abaab7cf288e9e21f697c2ee","lightbulb-01":"d188e885fe73ed38886aa59c83ad357a148b35fa","lightbulb-02":"5b1ff4bf3d4c17cbcbe51e731deeaf17af60a380","lightbulb-03":"2f214aa5678f5db6f7cb3331822760a9c123dfaf","lightbulb-04":"71a5227629e56a659d61c4c4a41cb2a112775543","lightbulb-05":"4bfd75c70e0e3c97eac570d6854f9ab09ebe4d6d","microphone-01":"57196c529b131f745d5f23672a1ead79d2a93c77","microphone-02":"51651de24be2459126647eb5e1b931e07c727077","microphone-off-01":"d32b5a90c88f84fff1d6b9322e717c2e370b6a9f","microphone-off-02":"92fafaca02383966f223137ea759dbe1e892bb2b","modem-01":"259c6991d956330cb3d475f20bf9f09adffd2743","modem-02":"a1051f1b6e5e348c9426149dcb0a570f4ae6aeb4","monitor-01":"227fdad8f6ff28993ce36b0e807cd87c54043e0f","monitor-02":"25c65098320a7f4c54246dd29cf7cf3645fc6218","monitor-03":"6c4130591148ed92641251e0fd4f2782a3aa7350","monitor-04":"ba606a8b4c4549486879982ebd10c1c3d558abb6","monitor-05":"929065334fcb6165537e7b47dcf3c55ef6046647","mouse":"fa6e83d928004760a19c467b60fb6b19cd720652","music-note-01":"80ed0fb02e146c5133048b73bb4dbdfbe0fcec79","music-note-02":"2f2fd30e24789cdd2d79b55f909b2fbd35ed0cd0","music-note-plus":"70147a4cd3bb42c04ad2ce202fa5e2ba5cbce6be","pause-circle":"30586c2d0c0fae422a4fdb7d18de056d303b0460","pause-square":"21ba2d6610ef3cb366e16ba55519f696f2b7f00e","phone-01":"15e08c1790d6f36620dce8b46d3c2466a365a4cc","phone-02":"d42adc3bd6693ce2313b447db9d8cd89697ee782","play":"f6b118622f64c280ad92600804318437143dcbcf","play-circle":"7267ee73c14c567fdb21e4d6098f1f5f0667addc","play-square":"31b5bf1742c022e51f5d32f684cf7deb3a973d6e","podcast":"b0114e3868e266ceff64ae0caf1022a1bfff1edb","power-01":"2fbb2cc5a0e9349b411efc85354dcdccd3e826e6","power-02":"99189eec134d1cebeb6bccac7565fcf7eee07953","power-03":"6f4feab74a2ecba1ed682cfe4c9e034f4518ce6d","printer":"fbb20a2878beb00b5aaa56b080df38851772252f","recording-01":"74c162661ad59b320643e45629bc3c6dfc05b0dd","recording-02":"ba39f2fe2ac997aa35886143eb581061e65ed215","recording-03":"73af6f1f1907664e11837e0a1514c34fff533baf","repeat-01":"d9ae442b03fcada0fd0633eaafe1dfed81b383e5","repeat-02":"96e2603b32b9ee6241047c4bdb7cd41fe3bc9d0f","repeat-03":"62811816082120c4cd2be74ffa627fd9bb8fb72f","repeat-04":"642a255a11090edd46eed1b09ea987c638f01363","rss-01":"42a8006ff7450341be978c36acfd1e94e8907d5a","rss-02":"2457e0f40b162525e367be5df0838a9f629b47c9","shuffle-01":"9a12efbbfb54571f7b27099574eeed1c9263c9a5","shuffle-02":"5cc33cc138cddc5f2e41bb6051c123cade0ff843","signal-01":"6b8fb8786db96d3b32ddaff788f3737df3f5d9f9","signal-02":"8b56199c129425c9757a3b7a90a0b4a339644ea3","signal-03":"91dc98e54e4de80de4279c85386568f0aeeb435e","simcard":"cff81ae382c531b4176efcc915fca3956a2f2629","skip-back":"607709eb031b08f3a2f265c19a25a8a93aaafd3d","skip-forward":"0a2d8f1efd171374b3cf110f3315d83444b451a5","sliders-01":"69c5dbc0629d72a29c735aa2321d96ac5bd62694","sliders-02":"880b8851556e054b1690a73a1289f683b9ff92c9","sliders-03":"111fae62db78f97dfe00878cfe6265d67b0e635f","sliders-04":"15375696078f6ea74a599e903462944cd828f86a","speaker-01":"fc818f2aab67f03c30c3c87d83284623fb8f68e3","speaker-02":"8a47e98bf521802866325220b8acc35d9c500c90","speaker-03":"159aeec4b17d21421101ff2c13cb7d28c1eb98ef","stop":"77e9599abb5ec90e3fde58e57619e40a168a3163","stop-circle":"0293dd779f4a9611abcbd8181762495a728e35f0","stop-square":"f97dea0c60558a1259e1e22c77590cc25d563398","tablet-01":"12925867a445681379d91c17567803fc269a90b2","tablet-02":"567f8a19cd7bfe5e6b9b64ebbcbca2290bd0cc87","tv-01":"028883a687c32611061ca32a8f2604e96895e7bb","tv-02":"ab84612ac49122371771a61b1594d9acff24862d","tv-03":"8b6f5dcd3cc296920f738f96e0f0bd4a3d4c7c7b","usb-flash-drive":"abc571dd238776fe9dbbe12848394a8bd64e0d35","video-recorder":"56b268e7474d0fa270e21fc050a87875a0f58e49","video-recorder-off":"6c7d9e74774bdb2bcc3f42142544dd4129dad88e","voicemail":"94b25d3226c335fe0275614a3b838857aa293621","volume-max":"14e0285dd7b102093ec6b08106caa0d47c8e71b0","volume-min":"ec2088e96d643b523dc70ad0cc0d8fb7f9fe56a9","volume-minus":"0a0f97bd0095dd843f9c31527f440dfda11336f9","volume-plus":"4aa35a13587f8c4f76546f012a026fe674e53d2c","volume-x":"2899556adea90e0871368bf215e7d77537e1d492","webcam-01":"1d4a1ddd6d37aa6ff1451f3b5206221e7a8fe94d","webcam-02":"01a9834674f1c7ff97566fa62df485d4badbb82e","wifi":"32b66bf1f551ff182731844664bc4ab0c92711df","wifi-off":"f3e1762fc565189e5708f19a22a45946d7a5d03c","youtube":"931ce8ce02fdd1e6341eec90a7339a11f1acfc95","camera-01":"af63811c2048c864719ff3ddc424e4dc0e3c33c7","camera-02":"207ca5de7de493cc0cf4761195da7c921c6b40b0","camera-03":"74c12f6afe655725bafcdcde8cc5c3b31e9668d0","camera-lens":"c16c2b23cf072854aca2e68013ef837886be9e90","camera-off":"6edd4f2942fc8279687466107386686f97d13880","camera-plus":"930740aabcba3e872c5f8ff21ce820cae0b60d89","colors":"11b9f52a56103b1cc0f733cd83869d0711a923a9","flash":"c7fcb7ce8a3521445f3a4f5109f69dd3f45972fb","flash-off":"8fa304ae1dcd6f391023f073d625b34805f9645a","image-01":"e034c66370c3f82110f7a1d4ed4592485f15bf2c","image-02":"2a13009f8156de80f93cf118fda730ca8b43d183","image-03":"510c2562d49efc40937469ce798c056e8ef6567f","image-04":"40af1a9b1160600759f517cf829e71c182540040","image-05":"1b8f2153bdd8604b7cb1eb79f506704d3b47fa8a","image-check":"ebe4bf926fa0c8efe03e149709ebef800f6e46df","image-down":"6c6c041a5fd2a5459fa0caa39d47dfd401ccb8b5","image-left":"d7c509df6450fead34741dc2015b958cd5571aeb","image-plus":"f1f85046b91af315d17c01cb8191202b9130b78f","image-right":"7e2828eb8944eee102e1c7107e5c87a72ccd0f94","image-up":"59541244b2bcd2edd398e94b67930356e511eb31","image-user":"335ca2837ad2bddf0c1c1472b91ff53dd4d3023f","image-user-check":"4624aeea3788f2534ca124a7f72a4fc86a1e07c3","image-user-down":"9c6652a8ef9ef7178560259bbb7818326676e644","image-user-left":"e56c2da57a00814b0210cbf43f49273cec2d212b","image-user-plus":"a9c48437941ad9a8f268805b92c5f94e05bb2eb8","image-user-right":"364187027dc248e6e836a7da7dad4baadf80d6df","image-user-up":"36d4f675e9d3370664e326b3ad36440832c07856","image-user-x":"05da5be821f3413d7819afbcf8e7fe1f1f4ae60a","image-x":"e9c7e01d598273372d8761805bba1a5f87bb28ce","annotation":"1a95aeefcc58fcacc9f2e83fac8ec5cfdd7639f1","annotation-alert":"11e83677011ae481bb71e4859ceba59608a63dc1","annotation-check":"42d60e45b06c82bec41420e814a1d07452b5a519","annotation-dots":"d78cd9d49070afb513f58503153046338f2ff92d","annotation-heart":"95d0d092e83fd0dd9feb4b5999cc201b45816c3a","annotation-info":"d900c2ea3df224e34c552e64ddbf5358a75101ab","annotation-plus":"60f8efbfe8bf6ef10b87d0a60e1b644e1401de61","annotation-question":"060f8357f8188a3907f2c9b18d4d4bdaefc9f074","annotation-x":"f41f953d796d3cd8e36f30c5ced895c21e277242","inbox-01":"90e62562f61cdb105cfeffbbb55f39ab6d98faa1","inbox-02":"b3933a0da5bb5964f5a47a67201ddd5b55f5b743","mail-01":"bd4009e880391605f29dcdc2d438d9fa2b652c4b","mail-02":"75504b62e0472c478af3498d8cfb44c5c6570a34","mail-03":"7f150df977e2a646a62c4ed83758c666d7f4e9e0","mail-04":"6dfa9cd9b02e89a9ab52375bde33b3655c1404a1","mail-05":"9f933853f3cb021f5699598e224e8e9d4ecde28c","message-alert-circle":"31e6571b3156f82a7cc90f2b36c54acb787919b8","message-alert-square":"761ad873badaf4880c578416e78c8947638ada26","message-chat-circle":"892884bb315bcfc4474debe5982bfbf38222fd16","message-chat-square":"1585d71e7b36dea3115b7a059c9389e2d3529075","message-check-circle":"f49962d4af6541d22817b51cd8e7d002ce67c9ad","message-check-square":"9bf56d8aff3e750be0c49902cc7a7861618fa498","message-circle-01":"cfb00d4e4a1eeed9763f37a0c84aee915aeae22e","message-circle-02":"c6083f9c7ae137c28addcd50ca230ac5bf5db064","message-dots-circle":"e7d4aa4464ca32514a7d09f79b4883753ea57afc","message-dots-square":"8a090cdc6f4849430e507ad304f537886d37d757","message-heart-circle":"07d08d004ca91028ba4d549908abb17c9d7b067c","message-heart-square":"31cd8b7c10179cc199c1267503a0923a1a7afb57","message-notification-circle":"592956165eb7569b7b57a8b9cda0a0599133ca4f","message-notification-square":"2272ae355caca3506f7af2ea2f523676d3bcf097","message-plus-circle":"1121e82ffa3e7f9d922ebddffe998fbef1ee8ee8","message-plus-square":"80705b9780d1c1a06b650ccf0b25dcfaf009aa70","message-question-circle":"21b050df0c5858ef15d3e8d41b5d28e95bff97fb","message-question-square":"6fb1fda6a4feffbdbcb11ec2582d0bd2f4114ccc","message-smile-circle":"3c8901767d6910744329b29f15ede68bf77ee776","message-smile-square":"14b0921c43188019c5662eb21f0cc8662a0ca645","message-square-01":"2df3de7de88b121641662564312c813862446b80","message-square-02":"3e0625239a9ce00170dae3c992f86af47dcb7f13","message-text-circle-01":"8e46cb12256a96fcb900361a45c255c5b204b738","message-text-circle-02":"30b5c8bccb906250c9e8d0171ec8ba8014ff57e8","message-text-square-01":"e6028bce9113e4b0989ff69d350c207ad17a5c50","message-text-square-02":"39d78b0eaf1137745cb2ef10f1fd40fed981ee00","message-x-circle":"e147cc647e907dd6ed22080a374968eb2c829662","message-x-square":"7c107754bf9d34d6f61fd63c2dea220904e12e5f","phone":"d2b00553f9ad40178c20d14d52ee6e10894d6ace","phone-call-01":"0d7e05b4fd6a825a14fbc191b34326b428be5cfb","phone-call-02":"02ad10aa80f6d64578a4869d6ba95124eaa355d4","phone-hang-up":"39d207fab68b1e4392041b2b85379dd5dd0cfce4","phone-incoming-01":"b53cbe8d53c68af7d36a0bdceb577ccd5f8a718d","phone-incoming-02":"8019363552b115ee7d525113406ce929dbaddded","phone-outgoing-01":"c6812989448d415d9fb37b88d1d1ac9909004d4b","phone-outgoing-02":"84bff3d231b992e8eaedec254a8f85cfb4d3abd1","phone-pause":"3615417b3429f8cc5fc87971f13013eee03b289b","phone-plus":"b47f4a3bdff3a64933127438de5aab471d94314e","phone-x":"b9f0b36c4384dc86f00244034bd8ae3f64d22fca","send-01":"337b43fc3607cdf8e64632532f96b4e8c69c12b6","send-02":"f276829f3030dfcb0fde440d9702a49672199d05","send-03":"31953c342e0dd8441d74a936cfcaf834ea2605a6","align-center":"111f5505632a7a7fe26e1ae8a4c690e057310021","align-justify":"3e4a1c2b899ccc05e49c792fdcf6b9d6dde12b99","align-left":"6b856369cfeaafa802c129f223295c1b11cc292d","align-right":"064bd7f55c1a767fc658cdf3e061a29effe17787","attachment-01":"601be5c2a9d9977a05fafc3ed37826c63f62331f","attachment-02":"3eb0a8922978345eab0f8db0a2dcc106d4c05df4","bezier-curve-01":"3066b81adc9b464d00352eb02570b0c7c9358b76","bezier-curve-02":"608d991988d284ba43b2e42fb51341ea45f62ad0","bezier-curve-03":"e1e174d8ad7b276432d42286362b7e5f5ea42681","bold-01":"582f3188556b29304a6e4ed2edecb720a56fe1ba","bold-02":"fbc715841788411f5e32f29f668d15d21c44fdec","bold-square":"50d9e2d75c5a68ab5bea2dffb2387f125f1385de","brush-01":"45497ba7ef2167eaf3425ada0353f3786bd4a872","brush-02":"a46d9e680db922865338866b0e5ea770622d8ef1","brush-03":"5180687a622c8c1e237067163d5788f4574b9b70","circle-cut":"0070f5bf32db00df45e1efefe7cb612f32ae6b2d","code-snippet-01":"356067df565d82e81a2a2cfdae30f44f481637cd","code-snippet-02":"624ba7b6973a706098fe16dc2ccf002c5d5e7e4d","command":"7bb4ee3a5432405329f942f1e2c658a69d73dc69","contrast-01":"93d9f6760922bafb63d7cfe74719418489778f4f","contrast-02":"bb296f0e7c8149ea42b112b67a9cb308b8b7b30c","contrast-03":"4bde48761800a573864bcb3d5493f3c5b70e596e","crop-01":"d0607b787b3e5be8a02ee35d5fc339d42fe52bf5","crop-02":"c9d3b79a2e347ada98f67223cf5d2cbbbdaeda8f","cursor-01":"8f023219a452aa043e03b130860fed339cf01d7c","cursor-02":"40c26062b6394544ebfd618f835614ce4179747a","cursor-03":"3ef1b8e4048a30060a0598a1c5e77d6df9ab3aed","cursor-04":"8e2993a0c1ed80f672fa3b2c24e9fc82f6155f25","cursor-box":"b652b9a6c9953663375e61b03bc59b9fcce9ae76","cursor-click-01":"54d7c21a7f7fe3565df541daa2e49796b5e85486","cursor-click-02":"f3f26940bee040f7b33a50f4b795687ed08f94f9","delete":"bde82f4f2aa09bd42afd4137b18f264e9daa9acc","dotpoints-01":"99c06213644f69d57c6002d09429c4c7671d13ba","dotpoints-02":"3186071a2d3f140d5f2af6fa6c70313105a23bdb","drop":"75d8728a9213dfbcfc8e48b8f5ddaf77b566cf47","dropper":"d7ddc911484197432a13251f3111a4d4e1388f1e","eraser":"93ab8170ee11925497f2c4ee67d6ee6747302716","feather":"461144150c9ebc6f7c880e9bbef3f12588232b50","figma":"e117cb410e11cda0c2a03f6355e9002372ef0272","framer":"3e47ac093455d7108aee2ada1b205d0dc7b14dd6","hand":"9b2c487525ccc598182c6d473fb8401872f103e5","heading-01":"ca16e661e710838676a8164bf61f520de7ca4de7","heading-02":"cad32b8ae058260bdbaaba7814c8ced015b75261","heading-square":"2192b569271c629f4e5124ce3aeb681df8d6871d","image-indent-left":"edc487c515d6b95db2527bf61a92901c34c898e6","image-indent-right":"47e022082a6ae4f8d58674fa64d2a947754008fc","italic-01":"50cf71b674dcd06a19ad4f1c65c9a9f88dbdb947","italic-02":"c5bc7e3cfa3e6d3b57a116244a0f067840ed3505","italic-square":"adb271417e5e06717d0b7e541f020526ab0a5a24","left-indent-01":"49aa2f14ec39c5a7abc3e3c33be08f4bcaf664dc","left-indent-02":"0e638cace6ea7861b3fa52ff04263db4af2ce36e","letter-spacing-01":"91c15c9ab4052858262d3b9099da0a57b5257b16","letter-spacing-02":"60c1e6f4c1627395296bea58aeeaab83342f14bd","line-height":"e30a8af3318e287cb7d5b123feb254b299afe0ac","magic-wand-01":"77df617c6141ea27e4fb950564f0cbada7f3b83b","magic-wand-02":"9d84e7acc6d54ea03e743a9143e664c6ce17eef8","move":"a7e0fa25d2b95007a00a85f67cc9b653e88e63cd","paint":"5615eac855f2d634bd2a46e3202e4cab737adcb8","paint-pour":"452f7939c26ca222c5523cfd4406104730c314d7","palette":"95aac69b9acf608bd47e9913faa6e259777f3fd7","paragraph-spacing":"6f9aaa00a1a929e4766400a65cb3e1a560c0401b","paragraph-wrap":"b4627fbba94cd5b33b7fde93c2161946d19d8d0d","pen-tool-01":"f4f27afb71a94eb8ec3cbefc901d89f033ec9ea7","pen-tool-02":"51cbba9f5912d6a48ec7f9b9217b7a4aad74fd78","pen-tool-minus":"9f01b3ba81ddaf9c4777b6baf9ebdafc4dd6a76d","pen-tool-plus":"de0815ac8c36c269a3b85144a5aa3601da6f522b","pencil-01":"e792b01cd30de23947d3b8fc97f0eda85483a634","pencil-02":"f82adb1783da3765848c054cce552dd3fa021a57","pencil-line":"3312046b3ded08937d7d23c62fee14c9a089f9b7","perspective-01":"cbee5ad1ec2978f03957f37512b6401660201c53","perspective-02":"697e8a4ac75b2c897d7dc561293498f0c0d77f62","pilcrow-01":"c7a019029c5fcceb2205c0eafa0708eac459dc80","pilcrow-02":"4eabc221344625358b4f6725e59d0973900e59af","pilcrow-square":"fc2671246916f75bf64e580f4175664e05a27c25","reflect-01":"fb6d0a678a8f5e8baa0151d8b69f13f1d94743d2","reflect-02":"da69eb3371ab94a3a5208cec3dd8fd5774404f3d","right-indent-01":"9988e37ce647fd9c8f61cd014b243c1b67b83cd5","right-indent-02":"94136159a12618d3b478cdc9ece462e33e5857f1","roller-brush":"a75a1c3975a5c8a5e9c246d5b777f560dbdc0426","scale-01":"a1e99b57cebe6d23bbeb4a607e734f63e55e30bd","scale-02":"52b7418ef967b2a2ac75997ca52e11aedf355eba","scale-03":"0a530b8f85d3b087dab75e6c112d25c97fcc07ac","scissors-01":"1314b051d073cd3969d326f32804b11ff12a7327","scissors-02":"7936b6aadc120c07c86adf52089736be12f94401","scissors-cut-01":"32e8bee547f47c1b11c87d5d186cb7c948ee752b","scissors-cut-02":"ceca29e8ca156f99fc2cb3f6384f790e158bb1d9","skew":"57fbf118e9ccf6e44ecf0116f07b14e1461e98de","strikethrough-01":"0e992a8a26d6007cc7e770719c478bf55b102fab","strikethrough-02":"5f1477d2cdc1741acba9f18433b1f4e9bc27d924","strikethrough-square":"b421c2f1c08b44c2191f957659ccc6183756f282","subscript":"76c3d77358ec012ebaa914dbc266455e557f3298","text-input":"4509cc012120034769385b62f08927ff6f4b6839","transform":"595859a2adc47ceb0e1437bc059493fd75ad1c07","type-01":"1b378d37d3c729bcbdd8a29e6c4b83352a9a40ab","type-02":"de457ba93f6def752579366f159b174a7e448d03","type-square":"d954fc92003010c695caeab7272e4cb3d2c0be74","type-strikethrough-01":"3b8d96ddeb500eac02caff81cfb6780dcb48f3ff","type-strikethrough-02":"e60cde89a6aa376999ce4425508eab9aeb6271e0","underline-01":"caca4c503bca3886bc320972676821458fbf6424","underline-02":"848befd9a83b18aee6568059cb38d9567fdfb052","underline-square":"9264a5ea6c0cbf823016bdf7278fb9531d95f349","zoom-in":"841df168bb0adbf07a1372a2c655682c0b6d6db7","zoom-out":"85bccb89ec40acf2f9b8e042e4e7165056fcb32f","alarm-clock":"a7d99b698c72e870cc6de043fdff43ca360e6026","alarm-clock-check":"cc7ae70bc30883238e8f156a5e391b4e8d5ddcb3","alarm-clock-minus":"4673eff8ddc40b5ef33bc42152f85ae12e529518","alarm-clock-off":"baa71880e6dbdf4ee12790411276506200764ad1","alarm-clock-plus":"7cc2adfbd44b3525ed1f52697dc2ccf5ab5e0b78","calendar":"82a8d70296a3c58aec2acac10d745dc7f39444d6","calendar-check-01":"955c2694adc39f8e6db9e6f7cff989c966bfb9ce","calendar-check-02":"f0780fad80cc7dca0a33de318563a5162ae3a6c1","calendar-date":"11679d5207fdba00fc5be2ddcb7879706a40b69a","calendar-heart-01":"1b717e72f0adcf24731c8c2cafdd453adade364d","calendar-heart-02":"89ffb17a38604681870a4493ddbe60240074b496","calendar-minus-01":"59344ffcfe95aea002e4ff1ac8092d52f39e12a7","calendar-minus-02":"a12606a23b00b90df050a67376540ba36bde2534","calendar-plus-01":"b2af77f8f656cab02a33f7ea158d3daa64c2bd80","calendar-plus-02":"d5fe908c4aeba9a89cf06cba536a9c9ecb8b50ac","clock":"5a9291f3228f7b1b17e59a5a12a8feb49f2da379","clock-check":"ada5b3edcba706a3277a5574d405d2c0b93151bd","clock-fast-forward":"687cedd39b1721aba0b01eaaab766e526782f691","clock-plus":"69b0cc3b08d5d67faf80d01c2cec4b914222b08f","clock-rewind":"820283657d05a1317a603680d46302b557f5e527","clock-snooze":"5e584f4bd36516be1c3a1095897917b6208e9225","clock-stopwatch":"16dd50e037fe8c884736b905f498761afa654c17","hourglass-01":"22d4ea21a7280f63a5d9f5ebc7bfd9ae9fad951d","hourglass-02":"937c9ff90e897ab1cd736d1878817195f65cd568","hourglass-03":"73f201363b55f65a773225e5948b7f5eaab6bd8a","clock-refresh":"dfb6dc5669a3f0812c14d976286d76c9dff884ef","watch-circle":"6dc21e41856b8fb02f6824eab575ed1c6c46274c","watch-square":"98419be1917c0c71041b02dcc2a9f4f9695fb504","file-01":"4933e182adc60e045ea8c6a1177aba592ff58164","file-02":"aefa9deee5f22c66e39dc0a972d974b6c691a4ff","file-03":"da6cea5d33569a7ea5757fa1b38cfa11690dd6ae","file-04":"d9eff2b59466098903c59fc65f13286e669fc0ca","file-05":"11c1fdfc1f123698954a665da28b7f470431a042","file-06":"0174ec3c865b42d4894cfe96e529f71080dbc4a5","file-07":"4ed7b7d4f3263cbb39c979734dbcefd84d228c7a","file-attachment-01":"5a3fdeaf5e398aadb252c51dc660eb155aa47a39","file-attachment-02":"b15af3781b675e128b1074975d17547a02650dc0","file-attachment-03":"365943247636aa064be2266d8f58d852904e580e","file-attachment-04":"7d771252bc83e3ec5dd424ae7782401e12db82a2","file-attachment-05":"ace25a199170a39eb817d0b5041739f420f19424","file-check-01":"a27453e6c45ac62819ccd7dcd03b3920ba8f2ead","file-check-02":"e69c05a59bece55c6c844235fa9e3d2908ce16a2","file-check-03":"cb7d5f78dedcab8335abfe0ab512b126169345c5","file-download-01":"dec305f1626ef694eb3fb3cbeafb256275b48a26","file-download-02":"7dcaa7cd14d70107e97b04a08c741fc70a661842","file-download-03":"49375af58c03ad8b83e8393cfb4070396f12abe3","file-heart-01":"811e514de7caad492eb7c5f6da07604a51b30e6f","file-heart-02":"81c5a6591a6025e7060185d05f41ef62201e29f1","file-heart-03":"3ff86830e281c68100f7deccb7d635f49d05a4b3","file-minus-01":"33b8847f944c5db977a6c877284c4220e4002277","file-minus-02":"b901390a9393bc5d24fd0b7668cec9c89c9c3c14","file-minus-03":"9101da59a76cf8a4bf74ba1db9761af49c87f8ec","file-plus-01":"ccdc9761df28e85b59f2db79cab9c72ff655e5ea","file-plus-02":"d27713399dcec49e3da7611974738a5945c5b6e7","file-plus-03":"b8d6a02241d373fb5c57ee574e502f73430ad36d","file-question-01":"1aa3057cde2e6f389d3d97b2f1de428136b643a2","file-question-02":"792c0c8ee87c0452c17a0bfef76aa39ab8e8f349","file-question-03":"62253da9b92af418a54eaf32bf875d254ee28efc","file-x-01":"cf95e9ad6ad03d2c600efbd3ef3c7a5d09d594c1","file-x-02":"6308465b9593cb21426cec05e2609d627625d2a6","file-x-03":"90f583ef924b7b141c0d18b557b4bc1532c501f9","file-search-01":"8bddcdd6901900f878c8fab3a04ad18f189aa4a4","file-search-02":"adb2afa62111f6bc85b460841056a52648c2fc53","file-search-03":"c85c22f17419e995b097b4cdba267e24a10ec361","folder":"87e945336db431c3e666f2db3351a6da731b115c","folder-check":"a15db6572ec9dd71f6853e26c6942334ef718f3f","folder-download":"28312b2de7f6b3af014c51b0876e5a8c87d21a24","folder-lock":"281066916abd163763bff99d96adb02a0e9cf2a7","folder-minus":"a9f4be6ffe5cdc94496cedb6152fede0a491e76a","folder-plus":"59316a0f936eb672f557768625e701e688c7899c","folder-question":"e523b5e07167efce702fe0767db454f8bdbf12b2","folder-search":"78be95613e6a72d3e66fe53e1278ecac95d7ec9a","folder-closed":"4f17ed3f5d98a901126963df6d394997127aa3d1","folder-x":"0a3cb566078ab5c5d6170a388ae6d8efbdb603c9","paperclip":"23064c3507df9f64ed12abcbf684b95d28eb4e91","clipboard":"da3926bc4a66447bf466ee1d3443bc8fee2d2637","clipboard-attachment":"b6abd2ed3080fce7b55a804d6252c624b42b9e9b","clipboard-download":"1df4d73ce1567805faf695489619fbbc2dc132f0","clipboard-check":"542ea8799783ca8be876f848edcc283dfea56017","clipboard-x":"50f1ebe1c690eddde6073846f29ce80d7cc1f5e4","clipboard-plus":"5ae6cb0a3ac4a42fc72664864f64e9faf85770fd","clipboard-minus":"16ad01b396763c09ba2834a79ab4a0f31196e5ea","sticker-square":"a901ce7726f216e2b714e4b924e27670bf59a917","sticker-circle":"2cd6df41f6f2dc68856a69f83a687b9d97b2afe4","box":"0590ad3b6bb7b40068c96640ebc31d239b376c80","bus":"8b1ee045d350c0199645eda80a26f8ea1ab8d38e","car-01":"8c8f2b6e93c3d610e79675cc4759cd086573929f","car-02":"97a726ec40c35f7be4510a65a72de3004cd205e4","compass-01":"169d70af0d35a6bf01ba8e34c594e57e4fd728e1","compass-02":"7a7c527ef9a1a55dfde4f95530a25c431a455744","compass-03":"2a8609b999bb96014ad6da4389b51f0f0705828d","flag-01":"7c66408e5dffb7205451fb617eb181f411236211","flag-02":"82396a34eb8dfd0953f1bc20722041175ce9af39","flag-03":"0ed6f0ce7c3c0104e498af2fad5af7c90fe2661a","flag-04":"56008ab131c03783aaa3e5e7e3753d2c89c7d842","flag-05":"eb038fde5bc19c0401d688b85fc9954d8e5cb929","flag-06":"f45ffb20eb264656dfb0986ba1b9ae663675b9d4","globe-01":"ca445eedbcbcef36c345b961863e766459e45934","globe-02":"9a2e1ffde87af44cbbc3424d6381a33481a2333f","globe-03":"3018592de29d31d5860521d1cd55c9b2400a7315","globe-04":"6b95041016bd3f135ccb1d4a109eeed9a118cfba","globe-05":"efd14661a9ba58fc0562529604dfede7f2c30136","globe-06":"d0b503529b57ac5c72b814ee3474643c00f1337c","luggage-01":"8887f4985468bf9ca542db02f2d1f4021f35aa29","luggage-02":"85ace403e8ab40d1c1070d3e178561427e2aef94","luggage-03":"890611fed59759f0aa300b427dc15a5b21096ae0","map-01":"78fb7ac5d127a34b26ffece112ffb1adabfedc33","map-02":"2a3cdc33e67b3d01bc81b778f64cb8f62d28ca86","mark":"c2c678c3af5d5f9d26d6a46b1b53d4702481e90c","marker-pin-01":"0c30d94ecfea81a6ba3a807dbdf41b8ba41db67a","marker-pin-02":"d70b32296115da244e4069f3b7a8347cd105483f","marker-pin-03":"78f778c4b1d821a060d563cdc38f30cf7455b65a","marker-pin-04":"f798008a0a4022bcec6c72cd4eec47762ee24824","marker-pin-05":"387a6c03de888186b2b2a869677cef1b1876487a","marker-pin-06":"0fb0be0ed81478d0dfd5cb34a8fbb89d3dbb7be6","navigation-pointer-01":"b8187f40949b81e9bef6ba9b48d1f09edc85b137","navigation-pointer-02":"57654ce2a8d592422a711a5d0283e6676833cc29","navigation-pointer-off-01":"18af725ee238ca42d305eba06d8c0720cf9d0e41","navigation-pointer-off-02":"a70bc51de63890f5e68c7956114a97ceba89a4ab","passport":"20cf2df92ce571e6ff4712366810b31af8e32982","rocket-01":"05750b1059600b769a6d7fc9017d962466df4c2d","plane":"bd1c088cf2fbda70f5870797449bb30972e0d45e","rocket-02":"bc51e1c45761e5fbe42a5af2053704b7ff942b5e","route":"0914ec3b332ae42928aa877d5d61710580ad4a08","ticket-01":"94c7ba853b64d79b43b337a67a9136cd6eb6328e","ticket-02":"39f50e481a1bf2e33f258dc19141dac123def2f4","train":"71d593d0fcf2f2977de466702ce65b396c7837ca","tram":"03bbe72d1b0c724a062af88285d5c77032132be3","truck-01":"7518cf3e17d92848a67ccdf950b100e45885f98e","truck-02":"da6257018b5044ae53f2f0839ece397ee2925b0d","cloud-01":"8ada17878009dcfe1ffc12f217ef1545a329ce1b","cloud-02":"de6f2467c995fdcf2070f2e82eecccd2e5c5bae2","cloud-03":"7e811ebed4ca452a80a01feb03a04d2907eeeea1","cloud-lightning":"295e90eb23914e8ed1656fc5687894e8214f9228","cloud-moon":"8faf5697755c75c6dc7d165de259ed0848af1781","cloud-off":"d968727e7bfca92a641f658baff283dfa3d73042","cloud-raining-01":"f51a10fb1b3c3dce5766ba023dca36ac76f872c8","cloud-raining-02":"339aaaf9aac54f78c31f9a86e76ed9937348f12f","cloud-raining-03":"339f894ba79027f6f5d5e2a86f6b6a3fabb39d73","cloud-raining-04":"b06ed244fc918c8f279ec8a700f1448496ec8481","cloud-raining-05":"b531b511be5f75d7d900ce5ba85c5e945db098c0","cloud-raining-06":"392c0e988da4c4933aa37d04f9c3b2724857d7af","cloud-snowing-01":"3901562c4f5c5a4196768761c093f550072d6ff2","cloud-snowing-02":"b8dabc43fa9cdca38b8b6f9d1e9cb812bbad4883","cloud-sun-01":"b9cea5548200e92b2a2d71e24e708643fc6fc3c3","cloud-sun-02":"063466addd46befd739eca2e9a943410ce1bd736","cloud-sun-03":"dd8689b05d1b465d5f64879fed7b66cfde559192","droplets-01":"75481679368edeca2262a70b171b77402b02ac93","droplets-02":"724421146d055c6f9a10b6115253cd13677c8be6","droplets-03":"c3713171e2e91b02a48c896151caec38b5914185","hurricane-01":"e026899eae6d1713384063ffd8dd2d493685a055","hurricane-02":"5a2aeec1fa5bd584bd7d2a10f216a8dc69994bf3","hurricane-03":"b44d42c721799ab6934b4e385045543024ae3cf2","lightning-01":"252ea3f7cedb633710d79895b872e44adaadee53","lightning-02":"0fc52eec0069c4a7b3f7a243445b932c7c7333be","moon-01":"fba87f7b245f46ba2af9185eed9ce329a2bcf0c2","moon-02":"8188293cf97b3704ae2d2a83a185531b1b13f413","moon-eclipse":"c3f922b9670a7656df7c4e74e8edbbc68a4b88c3","moon-star":"4b7a96433edece3a94f502094f5aa188413fca26","snowflake-01":"3ca40f7a92b98c6cae9743dfb424b6f6664c264e","snowflake-02":"7c9c354b5081bf7220b956f171f1e1a40ce33520","stars-01":"af8e5526df1e924969cf87d0ea0567fea0c245ec","stars-02":"bbc918edb840e41b9bf28d4be200dafea8803219","stars-03":"958f69ea06ee503d5ddb1c1847f94e2016763f66","sun":"dc317c195ec37140bfdb3478898804534113b201","sun-setting-01":"741d7d95a97d3615d25f9bebb430dd7d907198a8","sun-setting-02":"7e7a5efa1c8edc7158d545b103035e6c527de1bb","sun-setting-03":"b30891a6ef06341fa9e933fd77088690c84c45e1","sunrise":"486c41589d4f9dca70548232276c72a24301c0c1","sunset":"941bb9f8f11af19b6f163ecee3b97a3e1089df56","thermometer-01":"cf1df3e1f6e957a11948fbc1209e2d02d1044956","thermometer-02":"208c77d6c8dd8d0e8d33d97147716051dadc3294","thermometer-03":"82605e2952dd250e9a47a637b5ca69a852d1b68b","thermometer-cold":"25fabf8d5ee06cf4504f54b4c34329ed9760f763","thermometer-warm":"eeea747d8edc6c46ef4abfb76533f34ea7168cfd","umbrella-01":"aab43bc671991b1d085f9e7ef3d825bd57583ac4","umbrella-02":"41029f9e3171365e25f47ceb2fa712c01e81981b","umbrella-03":"1254d87273d0ab1dcc83eece8140b12355789d20","waves":"c9c792d1a15748cc75403a81b5e22c816f49ff83","wind-01":"f4ca5b19e5105cda95d9846373dd893b46de9586","wind-02":"ca61412fe50e44da0f59afedade0fd0ed247f349","wind-03":"2dfbd80f437d4fa43f833ff0c598654227ba9c74"};
/**
 * AFTER DS — Importar do site (plugin Figma).
 *
 * Recebe o JSON capturado pelo overlay do protótipo (CapturedScreen) e reconstrói
 * a tela: nós marcados como `ds` viram INSTÂNCIAS reais da biblioteca (pela key +
 * variantes já resolvidas na captura); o resto vira frames/texto/imagem com
 * auto-layout e cores literais. 100% determinístico, sem rede e sem IA.
 */

figma.showUI(__html__, { width: 380, height: 420 });

/* ----------------------------- cor ----------------------------- */

function clamp01(x) { return Math.max(0, Math.min(1, x)); }

function lin2srgb(x) { return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055; }

function oklabToRgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return { r: clamp01(lin2srgb(r)), g: clamp01(lin2srgb(g)), b: clamp01(lin2srgb(bb)) };
}

/** Converte qualquer cor CSS capturada (rgb/rgba/oklch/oklab) em {r,g,b,a} 0–1, ou null. */
function parseColor(str) {
  if (!str || str === "transparent" || str === "none") return null;
  let m;
  if ((m = str.match(/rgba?\(([^)]+)\)/))) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r: p[0] / 255, g: p[1] / 255, b: p[2] / 255, a: p[3] == null ? 1 : p[3] };
  }
  if ((m = str.match(/oklch\(([^)]+)\)/))) {
    const p = m[1].split(/[\s/]+/).filter(Boolean);
    const L = parseFloat(p[0]), C = parseFloat(p[1]), H = parseFloat(p[2]) || 0;
    const a = p[3] != null ? parseAlpha(p[3]) : 1;
    const hr = (H * Math.PI) / 180;
    const rgb = oklabToRgb(L, Math.cos(hr) * C, Math.sin(hr) * C);
    rgb.a = a; return rgb;
  }
  if ((m = str.match(/oklab\(([^)]+)\)/))) {
    const p = m[1].split(/[\s/]+/).filter(Boolean);
    const rgb = oklabToRgb(parseFloat(p[0]), parseFloat(p[1]), parseFloat(p[2]));
    rgb.a = p[3] != null ? parseAlpha(p[3]) : 1; return rgb;
  }
  return null;
}
function parseAlpha(s) { return s.indexOf("%") >= 0 ? parseFloat(s) / 100 : parseFloat(s); }

function solid(color) { return { type: "SOLID", color: { r: color.r, g: color.g, b: color.b }, opacity: color.a == null ? 1 : color.a }; }

/* ----------------------------- fontes ----------------------------- */

// Fonte do design system. Fallbacks: Elza → Inter → Inter Regular.
const FONTE_DS = "Elza";
const fontsCarregadas = new Set();
function estiloPorPeso(w) {
  if (w >= 700) return "Bold";
  if (w >= 600) return "Semibold";
  if (w >= 500) return "Medium";
  return "Regular";
}
async function carregarFonte(family, style) {
  // variantes de nome (Elza usa "Semibold"; Inter usa "Semi Bold")
  const alt = style === "Semibold" ? "Semi Bold" : style === "Semi Bold" ? "Semibold" : null;
  const tentativas = [
    { family, style },
    alt ? { family, style: alt } : null,
    { family, style: "Regular" },
    { family: "Inter", style },
    alt ? { family: "Inter", style: alt } : null,
    { family: "Inter", style: "Regular" },
  ].filter(Boolean);
  for (const f of tentativas) {
    const key = f.family + "|" + f.style;
    if (fontsCarregadas.has(key)) return f;
    try { await figma.loadFontAsync(f); fontsCarregadas.add(key); return f; } catch (e) { /* tenta o próximo */ }
  }
  return { family: "Inter", style: "Regular" };
}

/* ----------------------------- tokens (variáveis) ----------------------------- */

// Mapa nome-folha do token → key da variável (embutido de tokens.json — sem runtime lib).
const leafToVarKey = new Map(Object.entries(typeof TOKENS !== "undefined" ? TOKENS : {}));
let valueToLeaf = new Map();   // "r,g,b,a" → nome-folha (fallback por valor)
const varCache = new Map();    // nome-folha → Variable importada

function normColor(str) {
  const c = parseColor(str);
  if (!c) return null;
  const a = c.a == null ? 1 : c.a;
  return [Math.round(c.r * 255), Math.round(c.g * 255), Math.round(c.b * 255), Math.round(a * 100)].join(",");
}

// Só monta o índice valor→token (fallback). O leafToVarKey é estático/embutido.
function prepararTokens(screen) {
  valueToLeaf = new Map(); varCache.clear();
  const ehSemantico = (leaf) => !/-\d+$/.test(leaf);
  for (const [name, val] of Object.entries(screen.tokens || {})) {
    const leaf = name.replace(/^--color-/, "");
    const n = normColor(val);
    if (!n) continue;
    const atual = valueToLeaf.get(n);
    if (!atual || (ehSemantico(leaf) && !ehSemantico(atual))) valueToLeaf.set(n, leaf);
  }
}

async function importarVar(leaf) {
  if (varCache.has(leaf)) return varCache.get(leaf);
  const key = leafToVarKey.get(leaf);
  let v = null;
  if (key) { try { v = await figma.variables.importVariableByKeyAsync(key); } catch (e) { v = null; } }
  varCache.set(leaf, v);
  return v;
}

// Classe utilitária → nome-folha do token. Tenta a classe inteira (bg-secondary) E sem o
// prefixo de utilitário (utility-blue-700, fg-quaternary), cobrindo as duas convenções.
function classToLeaf(c) {
  if (leafToVarKey.has(c)) return c;
  const semPrefixo = c.replace(/^(bg|text|fg|border|ring|stroke|fill|outline)-/, "");
  if (leafToVarKey.has(semPrefixo)) return semPrefixo;
  return null;
}
function leafDeClasses(cls, kind) {
  if (!cls || !cls.length) return null;
  const prefs = kind === "bg" ? ["bg-"] : kind === "text" ? ["text-", "fg-"] : ["border-", "ring-", "outline-", "stroke-"];
  for (const c of cls) {
    if (prefs.some((p) => c.indexOf(p) === 0)) {
      const leaf = classToLeaf(c);
      if (leaf) return leaf;
    }
  }
  return null;
}

/**
 * Paint para uma cor. Prioridade: classe (token exato) → valor (token por valor) → literal.
 */
async function fillFor(colorStr, leafHint) {
  const c = parseColor(colorStr);
  let leaf = leafHint && leafToVarKey.has(leafHint) ? leafHint : null;
  if (!leaf && c) { const n = normColor(colorStr); leaf = (n && valueToLeaf.get(n)) || null; }
  if (leaf) {
    const v = await importarVar(leaf);
    if (v) {
      let p = solid(c || { r: 0, g: 0, b: 0, a: 1 });
      try { p = figma.variables.setBoundVariableForPaint(p, "color", v); } catch (e) { /* literal */ }
      return p;
    }
  }
  return c ? solid(c) : null;
}

/* ----------------------------- text styles ----------------------------- */

const TIER_SIZES = [[12, "Text xs"], [14, "Text sm"], [16, "Text md"], [18, "Text lg"], [20, "Text xl"], [24, "Display xs"], [30, "Display sm"], [36, "Display md"], [48, "Display lg"], [60, "Display xl"], [72, "Display 2xl"]];
function tierMaisProximo(size) {
  const s = size || 16;
  let best = TIER_SIZES[0], bd = Infinity;
  for (const t of TIER_SIZES) { const d = Math.abs(t[0] - s); if (d < bd) { bd = d; best = t; } }
  return best[1];
}
const pesoWord = (w) => (w >= 700 ? "Bold" : w >= 600 ? "Semibold" : w >= 500 ? "Medium" : "Regular");
const TEXT_STYLE_KEYS = {
  "Display 2xl/Regular": "fb5df65c3a363091e5536c9e939027f10107e9ce", "Display 2xl/Medium": "b5d3ee64d349488ece549bbfa9580cf5cb7a48a0", "Display 2xl/Semibold": "cd17faaa90c4328b6bcb2e4624bfd0000ae3bbd7", "Display 2xl/Bold": "07ef0cc8288e508a6b0bbcc0f7183b02e9f40d0f",
  "Display xl/Regular": "df64175056be7b39005da282ee3961aa566a3680", "Display xl/Medium": "9ae6c3bf17d7a32754723e7e4b1b54b1612cdc5d", "Display xl/Semibold": "b074c598a3d1f73ec043e672e06ef50eea485521", "Display xl/Bold": "a8a80eb7aecfb029e0b58671463a29da8bb0901e",
  "Display lg/Regular": "9265cba5dddebe19bc447ebd4fdf6b62a96e0a46", "Display lg/Medium": "9e3c274aa5ddda0b37b65b7ecc2fb51c7db380f5", "Display lg/Semibold": "e8f6fb815927e2800c6fde2027c7bbd8db7cba66", "Display lg/Bold": "cd0696936c9c0dfb05cde6b483d7920de348b3d4",
  "Display md/Regular": "4142476ba2b1fc81c0d74499776bad6e34b5f5bd", "Display md/Medium": "9fb0323de46444f5be1e6d0ba8454530eb25acca", "Display md/Semibold": "28fc29fd0f66f24d6af5ba20542dbc90713325ed", "Display md/Bold": "35d62bbdc4eb9032426d891196222a3268948356",
  "Display sm/Regular": "102033e9b6496186aef650b2ba9f758a14060ce9", "Display sm/Medium": "c6fe81620d0990529bec7abaa54bf66263c2c32b", "Display sm/Semibold": "f9185293eb120600509e13bf9996441bbfc15e28", "Display sm/Bold": "849b3b57d7a111212af380564c724d09ee2af605",
  "Display xs/Regular": "52d6e55956c1a6832ef360cb2c58e1b5bc26bbfe", "Display xs/Medium": "7e5c1a89f936e09b660e466164f4b7418a4259e4", "Display xs/Semibold": "696a03b78a1a2b22118f0656b2df615aedd48788", "Display xs/Bold": "5d503ac7045cd4b336102828e14839b653bce528",
  "Text xl/Regular": "d3b88178723da92ba07cab0630bded6280ed8f7d", "Text xl/Medium": "5062ae976ae046f8969f25b933ad4cecf72ccd11", "Text xl/Semibold": "ec88fce55676162ba24fcb3d6c71942254dd9ac5", "Text xl/Bold": "3d7f25207adf9c72479eae18a06daf59ba3333b9",
  "Text lg/Regular": "0a65e900b151850a5430f61c80502d879e4eb4b3", "Text lg/Medium": "06eb0d2611e9199ae63852be40d9baac597bf9d8", "Text lg/Semibold": "f78ca79b8cdabd902d151ac4dc6293839617131c", "Text lg/Bold": "068aed17f916642fe4d5015316e3f6883f4d63bf",
  "Text md/Regular": "93f9428d286d2cd06633e98bc6da12337dccab54", "Text md/Medium": "39c02304e7681adf6703e5d1dcfa874dc4323a58", "Text md/Semibold": "93b66145574839a5840e528dd5459c81fb2f50ea", "Text md/Bold": "a599c0e37de8cfe6777d13cfd702bd8cba6ea9e1",
  "Text sm/Regular": "24bb5a27a2b2ea2982ab6bc91ded8aa7b2aba287", "Text sm/Medium": "2d8dfd2cbd51db9cba2751c9d9d51435673bf986", "Text sm/Semibold": "d2540d73441ef1d1e967b88effc723696a25b30d", "Text sm/Bold": "b2072b7ec535fbd3603ad60797b04c3c50afedff",
  "Text xs/Regular": "7d1e3142cedaea07a3643a4d2bf8ee7bfd407b2c", "Text xs/Medium": "22b1afdeb1e71bff7d2e5eaac819d6a0a95a6ad9", "Text xs/Semibold": "c02aff159daf222063d4bdf5556cbaede11da944", "Text xs/Bold": "8f56d0d654d2e030d38b6af14fd17af3308c1e23",
};
/* ----------------------------- ícones ----------------------------- */

// PascalCase (BarChartSquare02) → kebab (bar-chart-square-02), como na lib de ícones.
function pascalParaKebab(s) {
  return s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Za-z])(\d)/g, "$1-$2").replace(/-+/g, "-").toLowerCase();
}
const iconCache = new Map();
async function instanciaIcone(nome, rect, colorStr, leafHint) {
  if (typeof ICONS === "undefined") return null;
  const key = ICONS[pascalParaKebab(nome)];
  if (!key) return null;
  let comp = iconCache.get(key);
  if (comp === undefined) { try { comp = await figma.importComponentByKeyAsync(key); } catch (e) { comp = null; } iconCache.set(key, comp); }
  if (!comp) return null;
  const inst = comp.createInstance();
  try { inst.resize(rect.width, rect.height); } catch (e) {}
  // recolore o ícone (stroke p/ line icons, fill p/ solid) com a cor/token do texto
  const paint = await fillFor(colorStr, leafHint);
  if (paint) {
    for (const n of inst.findAll((x) => "strokes" in x || "fills" in x)) {
      try { if (Array.isArray(n.strokes) && n.strokes.length) n.strokes = [paint]; } catch (e) {}
      try { if (Array.isArray(n.fills) && n.fills.length) n.fills = [paint]; } catch (e) {}
    }
  }
  return inst;
}

const textStyleCache = new Map();
/** Aplica o text style do DS que casa com tamanho+peso (sobrescreve fonte/size/lh). */
async function aplicarTextStyle(t, size, weight) {
  const tier = tierMaisProximo(size); // arredonda p/ o tier mais próximo (ex.: 10/11 → Text xs)
  const key = TEXT_STYLE_KEYS[tier + "/" + pesoWord(weight || 400)];
  if (!key) return false;
  try {
    let st = textStyleCache.get(key);
    if (!st) { st = await figma.importStyleByKeyAsync(key); textStyleCache.set(key, st); }
    await t.setTextStyleIdAsync(st.id);
    return true;
  } catch (e) { return false; }
}

/* ----------------------------- componentes ----------------------------- */

const setCache = new Map();
async function importarSet(key) {
  if (setCache.has(key)) return setCache.get(key);
  let node = null;
  try { node = await figma.importComponentSetByKeyAsync(key); }
  catch (e) {
    try { node = await figma.importComponentByKeyAsync(key); } catch (e2) { node = null; }
  }
  setCache.set(key, node);
  return node;
}

// Faz o swap de ícone numa instância (ex.: o ícone leading de um Button).
async function setIconSwap(inst, matchStr, iconName) {
  if (!iconName || typeof ICONS === "undefined") return;
  const key = ICONS[pascalParaKebab(iconName)];
  if (!key) return;
  let comp = iconCache.get(key);
  if (comp === undefined) { try { comp = await figma.importComponentByKeyAsync(key); } catch (e) { comp = null; } iconCache.set(key, comp); }
  if (!comp) return;
  const swapKey = Object.keys(inst.componentProperties || {}).find((k) => k.indexOf("swap") >= 0 && k.indexOf(matchStr) >= 0);
  if (swapKey) { try { inst.setProperties({ [swapKey]: comp.id }); } catch (e) { /* ignora */ } }
}

async function criarInstanciaDs(ds) {
  const set = await importarSet(ds.figmaKey);
  if (!set) return null;
  const base = set.type === "COMPONENT_SET" ? set.defaultVariant || set.children[0] : set;
  const inst = base.createInstance();

  // Monta props seguras: variantes válidas + desliga ícones (texto-only no v1).
  const safe = {};
  const groups = set.type === "COMPONENT_SET" ? set.variantGroupProperties || {} : {};
  const propsInst = inst.componentProperties || {};
  for (const [nome, val] of Object.entries(ds.properties || {})) {
    const g = groups[nome];
    if (g && g.values && g.values.indexOf(String(val)) >= 0) { safe[nome] = String(val); continue; }
    // bool/text: SÓ se a key existir EXATAMENTE (props reais têm sufixo #id; senão
    // o setProperties é atômico e quebraria tudo, perdendo até as variantes).
    const def = propsInst[nome];
    if (def) {
      if (def.type === "BOOLEAN" && typeof val === "boolean") safe[nome] = val;
      else if (def.type === "TEXT") safe[nome] = String(val);
    }
  }
  // Liga/desliga ícones conforme capturado (em vez de sempre desligar).
  for (const k of Object.keys(inst.componentProperties || {})) {
    if (inst.componentProperties[k].type !== "BOOLEAN") continue;
    if (k.indexOf("Icon leading") >= 0) safe[k] = !!ds.iconLeading;
    else if (k.indexOf("Icon trailing") >= 0) safe[k] = !!ds.iconTrailing;
  }
  try { inst.setProperties(safe); } catch (e) { /* mantém default */ }

  // Swaps dos ícones (precisa importar o componente do ícone e usar seu id).
  await setIconSwap(inst, "Icon leading", ds.iconLeading);
  await setIconSwap(inst, "Icon trailing", ds.iconTrailing);
  // Componentes icon-only (ButtonUtility): swap único "Icon swap".
  await setIconSwap(inst, "Icon swap", ds.iconLeading || ds.iconTrailing);

  // Texto do label.
  if (ds.text) {
    const t = inst.findOne((n) => n.type === "TEXT");
    if (t) {
      try {
        if (t.fontName !== figma.mixed) await figma.loadFontAsync(t.fontName);
        t.characters = ds.text;
      } catch (e) { /* ignora */ }
    }
  }
  return inst;
}

/* ----------------------------- células de tabela ----------------------------- */

const TABLE_CELL_KEY = "7250ad8cd6b00e3dd16fad9c056591777b0c95c2";
const TABLE_HEADER_CELL_KEY = "445db0c2d9a34607f934cee0a7c5238129b93ff5";

function textoDoNo(node) {
  if (node.text) return node.text;
  for (const c of node.children || []) {
    if (c.role === "text" && c.text) return c.text;
    const t = textoDoNo(c);
    if (t) return t;
  }
  return null;
}

// Detecta o Type da Table cell pelo conteúdo (nós DS já construídos no td).
function detectarTipoCelula(node) {
  let badges = 0, avatars = 0, btnUtil = 0, buttons = 0, icons = 0, selects = 0, toggles = 0, progress = 0;
  (function scan(n) {
    if (n.ds) {
      const c = n.ds.component;
      if (/^Badge/.test(c)) badges++;
      else if (c === "Avatar") avatars++;
      else if (c === "ButtonUtility") btnUtil++;
      else if (c === "Button") buttons++;
      else if (c === "Select" || c === "MultiSelect") selects++;
      else if (c === "Toggle") toggles++;
      else if (c === "ProgressBar" || c === "ProgressCircle") progress++;
    }
    if (n.role === "icon") icons++;
    (n.children || []).forEach(scan);
  })(node);
  if (avatars >= 2) return "Avatar group";
  if (avatars === 1) return "Avatar";
  if (badges >= 2) return "Badges multiple";
  if (badges === 1) return "Badge";
  if (selects) return "Select dropdown";
  if (progress) return "Progress bar";
  if (btnUtil >= 1 || icons >= 2) return "Action icons";
  if (buttons >= 1) return "Action buttons";
  return "Text";
}

// Texto "muted" (supporting) = cor terciária/quaternária, ou peso leve sem cor primária.
function mutedTexto(n) {
  const cls = n.cls || [];
  if (cls.indexOf("text-tertiary") >= 0 || cls.indexOf("text-quaternary") >= 0 || cls.indexOf("text-placeholder") >= 0) return true;
  if (cls.indexOf("text-primary") >= 0 || cls.indexOf("text-secondary") >= 0 || cls.indexOf("text-white") >= 0) return false;
  return (n.style.fontWeight || 400) <= 400;
}
// Coleta os textos da célula. 1 texto → leading OU supporting (cor/peso). 2+ → leading (forte) + supporting.
function textosCelula(node) {
  const txts = [];
  (function scan(n) { if (n.role === "text" && n.text) txts.push({ text: n.text, w: n.style.fontWeight || 400, muted: mutedTexto(n) }); (n.children || []).forEach(scan); })(node);
  if (!txts.length) return {};
  if (txts.length === 1) return txts[0].muted ? { supporting: txts[0].text } : { leading: txts[0].text };
  // leading = o não-muted de maior peso; senão o de maior peso geral. supporting = o resto.
  const naoMuted = txts.filter((t) => !t.muted);
  let leadIdx;
  if (naoMuted.length) leadIdx = txts.indexOf(naoMuted.reduce((a, b) => (b.w > a.w ? b : a)));
  else { leadIdx = 0; for (let i = 1; i < txts.length; i++) if (txts[i].w > txts[leadIdx].w) leadIdx = i; }
  const sup = txts.filter((_, i) => i !== leadIdx).map((t) => t.text).join(" ");
  return { leading: txts[leadIdx].text, supporting: sup || undefined };
}
function temCheckbox(node) {
  let achou = false;
  (function scan(n) { if (n.ds && n.ds.component === "Checkbox") achou = true; (n.children || []).forEach(scan); })(node);
  return achou;
}
async function setTextoPorNome(inst, nome, valor) {
  if (!valor) return;
  const t = inst.findOne((n) => n.type === "TEXT" && n.name === nome) || inst.findOne((n) => n.type === "TEXT");
  if (t) { try { if (t.fontName !== figma.mixed) await figma.loadFontAsync(t.fontName); t.characters = valor; } catch (e) {} }
}

// th/td → instância de Table header cell / Table cell. Retorna null se falhar (→ fallback frame).
async function criarCelula(node) {
  const header = node.tag === "th";
  const set = await importarSet(header ? TABLE_HEADER_CELL_KEY : TABLE_CELL_KEY);
  if (!set) return null;
  let inst;
  try { inst = (set.defaultVariant || set.children[0]).createInstance(); } catch (e) { return null; }
  const size = node.rect.height && node.rect.height < 56 ? "sm" : "md";
  const groups = set.type === "COMPONENT_SET" ? (() => { try { return set.variantGroupProperties || {}; } catch (e) { return {}; } })() : {};
  const { leading, supporting } = textosCelula(node);
  const checkbox = temCheckbox(node);
  const props = {};
  if (groups.Size) props.Size = size;

  if (header) {
    const txt = textoDoNo(node); // header: usa o texto cru (o rótulo, mesmo que "muted")
    if (groups.Checkbox) props.Checkbox = checkbox ? "True" : "False";
    if (groups.Text) props.Text = txt ? "True" : "False";
    try { inst.setProperties(props); } catch (e) {}
    await setTextoPorNome(inst, "Text", txt);
  } else {
    if (groups.Type) { const tipo = detectarTipoCelula(node); props.Type = groups.Type.values.indexOf(tipo) >= 0 ? tipo : "Text"; }
    // ligar/desligar checkbox, lead text e supporting conforme o conteúdo real
    for (const k of Object.keys(inst.componentProperties || {})) {
      if (inst.componentProperties[k].type !== "BOOLEAN") continue;
      if (k.indexOf("Lead action") >= 0) props[k] = checkbox;
      else if (k.indexOf("Supporting text") >= 0) props[k] = !!supporting;
      else if (k.indexOf("Lead text") >= 0) props[k] = !!leading;
    }
    try { inst.setProperties(props); } catch (e) {}
    await setTextoPorNome(inst, "Text", leading);
    if (supporting) await setTextoPorNome(inst, "Supporting text", supporting);
  }

  try { inst.resize(Math.max(1, node.rect.width), Math.max(1, node.rect.height)); } catch (e) {}
  return inst;
}

/* ----------------------------- estilo do frame ----------------------------- */

const ALIGN_PRIMARY = { "flex-start": "MIN", start: "MIN", center: "CENTER", "flex-end": "MAX", end: "MAX", "space-between": "SPACE_BETWEEN" };
const ALIGN_COUNTER = { "flex-start": "MIN", start: "MIN", center: "CENTER", "flex-end": "MAX", end: "MAX", stretch: "MIN", baseline: "MIN" };

async function aplicarVisual(frame, style, cls) {
  const bgLeaf = leafDeClasses(cls, "bg");
  const bg = (style.backgroundColor || bgLeaf) ? await fillFor(style.backgroundColor, bgLeaf) : null;
  frame.fills = bg ? [bg] : [];

  // Borda: border real OU ring (a maioria das bordas do DS é `ring-1 ring-border-*`,
  // que vira box-shadow no DOM, sem border-width). Largura: ring-N → N, ring → 1.
  const borderLeaf = leafDeClasses(cls, "border");
  let bw = style.borderWidth || 0;
  if (!bw && cls) for (const c of cls) { const m = c.match(/^ring(?:-(\d+))?$/); if (m) bw = m[1] ? Number(m[1]) : 1; }
  if (bw > 0 && (style.borderColor || borderLeaf)) {
    const bc = await fillFor(style.borderColor, borderLeaf);
    if (bc) { frame.strokes = [bc]; frame.strokeWeight = bw; frame.strokeAlign = "INSIDE"; }
  }
  if (style.borderRadius) frame.cornerRadius = style.borderRadius;
  if (style.opacity != null) frame.opacity = style.opacity;
}

const TABELA_VERTICAL = new Set(["table", "thead", "tbody", "tfoot"]);
function aplicarLayout(frame, style, tag) {
  // Tabela nativa (<table>/<tr>) não é flex no DOM → forço auto-layout p/ reconstruir a grade.
  if (TABELA_VERTICAL.has(tag)) {
    frame.layoutMode = "VERTICAL"; frame.itemSpacing = 0;
    frame.primaryAxisSizingMode = "FIXED"; frame.counterAxisSizingMode = "FIXED";
    return true;
  }
  if (tag === "tr") {
    frame.layoutMode = "HORIZONTAL"; frame.itemSpacing = 0;
    frame.primaryAxisSizingMode = "FIXED"; frame.counterAxisSizingMode = "FIXED";
    frame.counterAxisAlignItems = "MIN";
    return true;
  }
  const isFlex = style.display && style.display.indexOf("flex") >= 0;
  if (!isFlex) { frame.layoutMode = "NONE"; return false; }
  frame.layoutMode = style.flexDirection === "column" ? "VERTICAL" : "HORIZONTAL";
  frame.itemSpacing = style.gap || 0;
  frame.paddingTop = style.paddingTop || 0;
  frame.paddingBottom = style.paddingBottom || 0;
  frame.paddingLeft = style.paddingLeft || 0;
  frame.paddingRight = style.paddingRight || 0;
  if (style.justifyContent && ALIGN_PRIMARY[style.justifyContent]) frame.primaryAxisAlignItems = ALIGN_PRIMARY[style.justifyContent];
  if (style.alignItems && ALIGN_COUNTER[style.alignItems]) frame.counterAxisAlignItems = ALIGN_COUNTER[style.alignItems];
  frame.primaryAxisSizingMode = "FIXED";
  frame.counterAxisSizingMode = "FIXED";
  return true;
}

/* ----------------------------- spacing (padding/gap) ----------------------------- */

const SPACING_MAP = new Map(Object.entries(typeof SPACING !== "undefined" ? SPACING : {}));
const spacingVarCache = new Map();
async function importSpacingVar(key) {
  if (spacingVarCache.has(key)) return spacingVarCache.get(key);
  let v = null;
  try { v = await figma.variables.importVariableByKeyAsync(key); } catch (e) { v = null; }
  spacingVarCache.set(key, v);
  return v;
}
// A partir das classes, descobre quais campos têm token de spacing.
function camposDeSpacing(cls) {
  const f = {};
  for (const c of cls || []) {
    if (/^p-\d/.test(c) || c.indexOf("p-") === 0) { f.paddingTop = f.paddingBottom = f.paddingLeft = f.paddingRight = true; }
    if (c.indexOf("px-") === 0) { f.paddingLeft = f.paddingRight = true; }
    if (c.indexOf("py-") === 0) { f.paddingTop = f.paddingBottom = true; }
    if (c.indexOf("pt-") === 0) f.paddingTop = true;
    if (c.indexOf("pb-") === 0) f.paddingBottom = true;
    if (c.indexOf("pl-") === 0) f.paddingLeft = true;
    if (c.indexOf("pr-") === 0) f.paddingRight = true;
    if (c.indexOf("gap-") === 0) f.itemSpacing = true;
  }
  return f;
}
// Binda padding/itemSpacing à variável de spacing (gate por classe; valor px → token).
async function bindSpacing(frame, style, cls) {
  const f = camposDeSpacing(cls);
  const pares = [["itemSpacing", style.gap], ["paddingTop", style.paddingTop], ["paddingBottom", style.paddingBottom], ["paddingLeft", style.paddingLeft], ["paddingRight", style.paddingRight]];
  for (const [field, px] of pares) {
    if (!f[field] || !px) continue;
    const key = SPACING_MAP.get(String(px));
    if (!key) continue;
    const v = await importSpacingVar(key);
    if (v) { try { frame.setBoundVariable(field, v); } catch (e) { /* ignora */ } }
  }
}

/* ----------------------------- build recursivo ----------------------------- */

async function buildNode(node) {
  // DS → instância
  if (node.role === "ds" && node.ds) {
    const inst = await criarInstanciaDs(node.ds);
    if (inst) { try { inst.resize(node.rect.width, node.rect.height); } catch (e) {} return inst; }
    // fallback: vira frame se a key falhar
  }

  if (node.role === "icon" && node.icon) {
    const inst = await instanciaIcone(node.icon, node.rect, node.style.color, leafDeClasses(node.cls, "text"));
    if (inst) return inst;
    const r = figma.createRectangle();
    r.resize(Math.max(1, node.rect.width), Math.max(1, node.rect.height));
    r.fills = [];
    r.name = "ícone: " + node.icon;
    return r;
  }

  // Célula de tabela → instância (fallback p/ frame se o set falhar).
  if (node.tag === "th" || node.tag === "td") {
    const cel = await criarCelula(node);
    if (cel) return cel;
  }

  if (node.role === "text") {
    const t = figma.createText();
    const fn = await carregarFonte(FONTE_DS, estiloPorPeso(node.style.fontWeight || 400));
    t.fontName = fn;
    t.characters = node.text || "";
    if (node.style.fontSize) t.fontSize = node.style.fontSize;
    if (node.style.lineHeight) t.lineHeight = { value: node.style.lineHeight, unit: "PIXELS" };
    if (node.style.letterSpacing) t.letterSpacing = { value: node.style.letterSpacing, unit: "PIXELS" };
    if (node.style.textAlign === "center") t.textAlignHorizontal = "CENTER";
    else if (node.style.textAlign === "right" || node.style.textAlign === "end") t.textAlignHorizontal = "RIGHT";
    t.textAutoResize = "NONE";
    try { t.resize(Math.max(1, node.rect.width), Math.max(1, node.rect.height)); } catch (e) {}
    // Aplica o text style do DS (troca a fonte) ANTES de pintar — o text style reseta o fill.
    await aplicarTextStyle(t, node.style.fontSize, node.style.fontWeight);
    // Cor por ÚLTIMO (fill não exige fonte carregada, então não dá erro de fonte).
    const col = await fillFor(node.style.color, leafDeClasses(node.cls, "text"));
    if (col) t.fills = [col];
    return t;
  }

  if (node.role === "image") {
    const r = figma.createRectangle();
    r.resize(Math.max(1, node.rect.width), Math.max(1, node.rect.height));
    r.cornerRadius = node.style.borderRadius || 0;
    r.fills = [{ type: "SOLID", color: { r: 0.85, g: 0.85, b: 0.85 } }];
    r.name = "imagem (placeholder)";
    return r;
  }

  // frame
  const frame = figma.createFrame();
  frame.name = node.tag || "frame";
  frame.clipsContent = false;
  frame.resize(Math.max(1, node.rect.width), Math.max(1, node.rect.height));
  await aplicarVisual(frame, node.style, node.cls);
  const flex = aplicarLayout(frame, node.style, node.tag);
  if (flex) await bindSpacing(frame, node.style, node.cls);

  for (const child of node.children || []) {
    const childNode = await buildNode(child);
    if (!childNode) continue;
    frame.appendChild(childNode);
    if (!flex) {
      // posiciona pelo offset relativo (layout absoluto)
      childNode.x = child.rect.x - node.rect.x;
      childNode.y = child.rect.y - node.rect.y;
    }
  }
  return frame;
}

/* ----------------------------- entrada ----------------------------- */

figma.ui.onmessage = async (msg) => {
  if (msg.type !== "import") return;
  try {
    const screen = msg.screen;
    await prepararTokens(screen);
    const root = await buildNode(screen.root);

    // Importa o frame direto na página (sem Section), ao lado do que está no viewport.
    root.name = "Import: " + (screen.pathname || "site");
    figma.currentPage.appendChild(root);
    const vb = figma.viewport.bounds;
    root.x = Math.round(vb.x + 40);
    root.y = Math.round(vb.y + 40);

    figma.currentPage.selection = [root];
    figma.viewport.scrollAndZoomIntoView([root]);
    figma.ui.postMessage({ type: "done", message: "Tela importada com sucesso." });
    figma.notify("Tela importada ✓");
  } catch (e) {
    figma.ui.postMessage({ type: "error", message: String((e && e.message) || e) });
    figma.notify("Falha ao importar: " + String((e && e.message) || e), { error: true });
  }
};
