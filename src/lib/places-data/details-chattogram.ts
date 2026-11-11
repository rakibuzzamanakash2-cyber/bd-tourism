import type { PlaceDetails } from "./types";

// Longer write-ups for the Chattogram division places.
// Each entry: [about, best time, getting there, good to know?]
const PERMIT = "Foreign visitors need a permit for the Hill Tracts; we arrange it with your booking. Carry your passport for checkpoints.";

export const CHATTOGRAM_DETAILS: Record<string, Record<string, PlaceDetails>> = {
  bandarban: {
    Nilgiri: [
      "Nilgiri sits at about 2,200 feet on the road from Bandarban to Thanchi. On most mornings the valleys below fill with cloud, and you look out over a white sea with green hilltops rising from it.\n\nThe hilltop has a small resort and viewing decks run by the army. On a clear day you can see the Sangu river far below.",
      "October to March for clear views; June to September for clouds and green hills.",
      "About 47 km from Bandarban town, 2 hours by jeep (chander gari) on a winding hill road.",
      PERMIT,
    ],
    Nilachal: [
      "Nilachal is a hilltop park about 2,000 feet up, just outside Bandarban town. From its viewing platforms you see the whole town, the Sangu river and rows of hills fading into the distance.\n\nIt is the easiest viewpoint to reach, and the favourite place for sunset.",
      "October to March; go an hour before sunset.",
      "About 5 km from Bandarban town, 20 minutes by CNG or jeep.",
      PERMIT,
    ],
    "Golden Temple": [
      "The Buddha Dhatu Jadi stands on a hill at Balaghata and is the largest Theravada temple in Bangladesh. Finished in 2000 in the Burmese style, its golden spire can be seen from far away.\n\nIt holds a relic of the Buddha and a large bell, and looks over the town and hills.",
      "October to March, in the morning or late afternoon.",
      "About 4 km from Bandarban town at Balaghata, by CNG.",
      "Remove shoes and cover shoulders and knees. Visiting hours for tourists are limited; check locally.",
    ],
    "Boga Lake": [
      "Boga Lake lies about 1,200 feet up in the hills beyond Ruma. Its deep blue-green water has no visible stream in or out, and the Bawm people tell a legend of a dragon that lived there.\n\nYou stay in simple wooden cottages in the Bawm village beside the lake. It is also the first night on the trek to Keokradong.",
      "November to February.",
      "Bandarban to Ruma Bazar by bus or jeep (about 3 hours), then a jeep and a steep walk to the lake.",
      "You must register with the army at Ruma and take a registered local guide. The area is sometimes closed to visitors, so check before you plan. " + PERMIT,
    ],
    "Nafakhum waterfall": [
      "At Nafakhum the Remakri river drops about 25 to 30 feet across its whole width, which is why people call it the Niagara of Bangladesh. The force of the water in the monsoon is impressive.\n\nGetting there is half the adventure: a boat up the Sangu to Remakri, then a walk of two to three hours along the stream.",
      "October to February, when the river is safe to travel.",
      "Bandarban to Thanchi by jeep or bus (4 hours), boat to Remakri (2 hours), then walk.",
      "You must register at Thanchi and take a registered guide. Plan at least three days from Bandarban. " + PERMIT,
    ],
    "Sangu river by boat": [
      "The Sangu is one of the few rivers that starts and ends inside Bangladesh. Above Thanchi it runs clear and green between steep forested hills, past the big boulders of Tindu and Boro Pathor.\n\nNarrow engine boats take you upstream through small rapids to Remakri. Marma villages sit high on the banks.",
      "October to February.",
      "Boats leave from Thanchi ghat, 4 hours by road from Bandarban town.",
      "Wear a life jacket. Registration and a guide are required at Thanchi. " + PERMIT,
    ],
    "Keokradong trek": [
      "Keokradong, at around 3,200 feet, is one of the highest peaks in Bangladesh. The classic trek goes from Ruma to Boga Lake on the first day and up to the summit on the second, passing Bawm villages like Darjeeling Para.\n\nThe path is clear and not technical, but it is a real mountain walk with long climbs.",
      "November to February.",
      "Start from Ruma Bazar, 3 hours from Bandarban town.",
      "A registered guide is compulsory. The route is sometimes closed for security reasons. " + PERMIT,
    ],
    Meghla: [
      "Meghla is a park around a lake at the entrance to Bandarban town. It has two hanging bridges, a short cable car, paddle boats, a small zoo and picnic areas.\n\nIt is a good easy stop for families on the way in or out of town.",
      "October to March.",
      "About 4 km before Bandarban town on the Chattogram road.",
      PERMIT,
    ],
    "Shoilo Propat waterfall": [
      "Shoilo Propat is a stream that runs over wide rock steps right beside the road to Nilgiri. The water is cold and clear, and strongest in the rains.\n\nBawm women from the nearby village sell handwoven shawls, blankets and local fruit at stalls beside it.",
      "June to October for the most water; open all year.",
      "About 8 km from Bandarban town on the Thanchi road.",
      "The rocks are slippery; wear shoes with grip.",
    ],
    "Bamboo chicken": [
      "Hill cooks pack chicken with ginger, garlic, chili and wild herbs into a length of green bamboo, seal it with leaves and roast it in the fire. The meat steams in its own juice and takes on a light bamboo flavour.\n\nYou find it at Marma and Bawm restaurants in Bandarban town and at the hill resorts.",
      "Any time of year.",
      "Local restaurants in Bandarban town; order ahead, as it takes about an hour.",
    ],
  },
  brahmanbaria: {
    "Titas river": [
      "The Titas gave its name to Adwaita Mallabarman's novel about the Malo fishing people, and to Ritwik Ghatak's famous film of it. The river still winds past fishing villages and wide fields.\n\nIn the monsoon it spreads into the low land and boats become the main transport.",
      "July to October for full water; winter for calm boat rides.",
      "The river runs beside Brahmanbaria town; boats can be hired at the ghats.",
    ],
    "Kalbhairab temple": [
      "The Kalbhairab temple at Medda holds a huge image of Shiva in his fierce form as Kalbhairab, around 28 feet tall. It is one of the tallest such images in the region.\n\nThe temple is busiest during the annual puja and fair in spring.",
      "Any time of year.",
      "At Medda in Brahmanbaria town, by rickshaw.",
    ],
    "Arifail Mosque": [
      "The Arifail Mosque was built in 1662 and looks a little like a small Taj Mahal with its three domes and corner towers. It stands beside a large pond called Sagar Dighi.\n\nNext to it is a pair of old tombs known locally as the Jora Kobor.",
      "November to February.",
      "In Sarail upazila, about 15 km from Brahmanbaria town.",
      "Dress modestly and avoid prayer times.",
    ],
    "Haripur Zamindar Bari": [
      "This three-storey palace was built in the 19th century on the bank of the Titas at Haripur. A wide flight of steps leads from the house straight down to the river.\n\nIts faded grandeur has made it a favourite location for Bangladeshi films and dramas.",
      "July to October, when the river reaches the steps; winter for easy road travel.",
      "In Nasirnagar upazila, about 30 km from Brahmanbaria town.",
    ],
    Chhanamukhi: [
      "Chhanamukhi is made by cutting fresh chhana into small cubes and coating them in a dry crust of sugar. It is firm outside and soft inside.\n\nThe sweet has been made in Brahmanbaria for well over a century and is the gift everyone takes home from here.",
      "Any time of year.",
      "Sweet shops in Brahmanbaria town.",
    ],
  },
  chandpur: {
    "Boro Station confluence": [
      "At the western tip of Chandpur town the Padma, the Meghna and the Dakatia come together. The meeting point, called the Molehead, has a walkway and benches.\n\nThe water here is wide and restless, with launches, trawlers and ilish boats passing all day.",
      "November to March; sunset is the best time.",
      "At the end of the town near the old railway station. Chandpur is 3 to 4 hours from Dhaka by launch from Sadarghat.",
    ],
    "Chandpur ilish": [
      "Chandpur calls itself the 'City of Hilsa'. Fishing boats land their catch at the Boro Station ghat, where it is auctioned from early morning.\n\nNearby restaurants fry the fish fresh or cook it in mustard sauce. The fish is richest in the monsoon.",
      "August to October. Fishing is banned for a few weeks around October to protect breeding fish.",
      "The fish ghat is next to Boro Station in Chandpur town.",
    ],
    "Hajiganj Boro Mosque": [
      "The Hajiganj Boro Mosque began as a small prayer house and grew into one of the largest mosques in the region, with a tall minaret. Its main building dates from the 1930s.\n\nThousands attend Friday prayers, and the last Friday of Ramadan draws enormous crowds.",
      "Any time of year.",
      "In Hajiganj town, about 20 km east of Chandpur.",
      "Dress modestly and avoid prayer times.",
    ],
  },
  chattogram: {
    "Chandranath Hill": [
      "Chandranath is a holy hill for Hindus, about 1,000 feet high, with a Shiva temple at the top. Pilgrims climb it in their thousands at the Shiva Chaturdashi fair in February or March.\n\nThe path goes up through forest by steep stone steps. From the top you see the Bay of Bengal on one side and green hills on the other.",
      "November to February.",
      "At Sitakunda, about 37 km north of Chattogram city. Take a bus or car to Sitakunda bazar, then a CNG to the foot of the hill.",
      "Carry water. The steps are steep, and slippery after rain.",
    ],
    "Guliakhali beach": [
      "Guliakhali looks like no other beach in the country. A carpet of green grass is cut by small tidal channels, with kewra mangroves behind and the sea in front.\n\nAt high tide the channels fill and the grass seems to float. Local boats take visitors out along the shore.",
      "November to February.",
      "About 5 km west of Sitakunda bazar by CNG.",
      "Check the tide; parts of the beach go under water at high tide.",
    ],
    "Mohamaya Lake": [
      "Mohamaya is a man-made lake surrounded by low forested hills at Mirsarai. Its arms reach far back between the hills, with a small waterfall and a rubber dam at the end.\n\nYou can rent a kayak or take an engine boat, and camping by the lake is popular.",
      "October to February; the waterfall is best after the rains.",
      "At Mirsarai, about 45 km north of Chattogram city, just off the Dhaka–Chattogram highway.",
    ],
    "Khaiyachora waterfall": [
      "Khaiyachora falls in a series of steps down a forested hillside; people count up to nine levels. Each step has a pool where you can cool off.\n\nThe walk in takes about an hour along a stream and through villages, and local boys work as guides.",
      "June to October for the most water.",
      "At Mirsarai, about 4 km east of the highway at Boro Takia bazar.",
      "The rocks are very slippery, and flash floods happen in heavy rain. Go with a local guide.",
    ],
    "Patenga beach": [
      "Patenga lies at the mouth of the Karnaphuli, near the airport and the port. Big concrete blocks protect the shore, and a long promenade runs behind it.\n\nPeople come to watch ships waiting to enter the port, eat fried crab and street snacks, and see the sun go down.",
      "November to February, at sunset.",
      "About 14 km from the centre of Chattogram city, 40 minutes by car or CNG.",
      "The sea here is not good for swimming.",
    ],
    "Foy's Lake": [
      "Foy's Lake was dug in 1924 by the Assam Bengal Railway and is named after its engineer. It winds between green hills in the Pahartali area.\n\nToday it has boat rides, an amusement park and a water park, with resorts on the far shore.",
      "November to February.",
      "In Pahartali, about 8 km from the city centre.",
      "There is an entry ticket; rides cost extra.",
    ],
    "Bayazid Bostami shrine": [
      "This hilltop shrine is dedicated to the Persian Sufi Bayazid Bostami, though historians doubt he ever came here. At the foot of the hill is a large pond full of black softshell turtles.\n\nThese turtles, called Bostami turtles, are extremely rare and are found in very few places in the world. Pilgrims feed them by hand.",
      "Any time of year.",
      "At Nasirabad, about 6 km from the city centre.",
      "Dress modestly and remove shoes at the shrine.",
    ],
    "Ethnological Museum": [
      "The Ethnological Museum at Agrabad opened in 1974 and is the only one of its kind in the country. Its galleries show the homes, clothes, tools and festivals of the Chakma, Marma, Tripura, Garo, Santal and many other communities.\n\nIt is a useful stop before travelling into the Hill Tracts.",
      "Any time of year.",
      "In Agrabad commercial area, central Chattogram.",
      "Closed on Sundays, and on Monday mornings.",
    ],
    "Chittagong War Cemetery": [
      "More than 700 soldiers and airmen of the Second World War are buried here, from Britain, undivided India, Africa, Australia, Japan and other countries. Most died on the Burma front.\n\nThe Commonwealth War Graves Commission keeps the lawns and flower beds immaculate. It is a quiet, moving place in the middle of the city.",
      "Any time of year, in the morning or late afternoon.",
      "On Badshah Mia Road near the Fine Arts Institute, central Chattogram.",
      "It is a place of remembrance; please keep quiet.",
    ],
    "Karnaphuli river": [
      "The Karnaphuli comes down from the Lushai Hills through Rangamati and reaches the sea at Chattogram. Its lower part is the country's main port.\n\nA boat from Sadarghat or the Abhoy Mitra ghat takes you past ocean ships, wooden fishing trawlers and the boatyards on the south bank.",
      "November to March, late afternoon.",
      "Hire a boat at Sadarghat or Abhoy Mitra ghat in the old city.",
    ],
    "Mezbani beef": [
      "A mezban is a traditional Chattogram feast where a family feeds hundreds of guests. The centre of it is mezbani beef: meat cooked for hours with a special dark, spicy masala.\n\nIt is served with plain rice and a dal of bones and lentils. Many restaurants in the city now serve it every day.",
      "Any time of year.",
      "Mezban restaurants in the GEC and Agrabad areas of Chattogram city.",
    ],
  },
  cumilla: {
    "Shalban Vihara": [
      "Shalban Vihara was a Buddhist monastery built by the Deva kings in the 7th and 8th centuries. Its square of 115 monks' cells surrounds a cross-shaped temple in the centre.\n\nIt is the largest of more than fifty Buddhist sites along the Mainamati–Lalmai ridge.",
      "November to February.",
      "At Kotbari, about 8 km west of Cumilla city; 2 to 2.5 hours from Dhaka by road.",
      "Closed on Sundays, and on Monday mornings.",
    ],
    "Mainamati Museum": [
      "The museum beside Shalban Vihara holds what was dug from the Mainamati sites: bronze statues of the Buddha and Bodhisattvas, a huge bronze bell, gold and silver coins, and terracotta plaques of animals and people.\n\nIt gives meaning to the brick ruins outside.",
      "November to February.",
      "At Kotbari, next to Shalban Vihara.",
      "Closed on Sundays, and on Monday mornings.",
    ],
    "Kotila Mura": [
      "On a low hilltop stand three stupas in a row, built in the 7th century. They represent the Three Jewels of Buddhism: the Buddha, the teaching and the community of monks.\n\nThe site is small and peaceful, with views over the ridge.",
      "November to February.",
      "About 5 km north of Shalban Vihara, inside the cantonment area.",
      "It lies inside a military area; access can be restricted, so check first.",
    ],
    "Cumilla War Cemetery": [
      "The Mainamati War Cemetery holds more than 700 graves from the Second World War, including soldiers from Britain, India, Africa and Japan. Cumilla was then a major army and hospital base.\n\nThe graves lie on a gentle slope with flowering trees and neat lawns.",
      "Any time of year.",
      "On the Cumilla–Sylhet road, about 9 km from the city.",
    ],
    Dharmasagar: [
      "Dharmasagar is a large reservoir dug in the 15th century by King Dharma Manikya of Tripura to give the town drinking water. Trees and a walkway line its banks.\n\nBoats can be hired, and the north bank has a park where the city relaxes in the evening.",
      "Evenings, from November to March.",
      "In the centre of Cumilla city.",
    ],
    "Cumilla khadi": [
      "Khadi is cloth spun and woven by hand. It became a symbol of self-reliance during Gandhi's movement in the 1920s, and Cumilla has been its centre in Bengal ever since.\n\nShops in the city sell khadi shirts, panjabis, saris and bedcovers in natural and bright colours.",
      "Any time of year.",
      "Khadi shops at Kandirpar and Monoharpur in Cumilla city.",
    ],
    "Matri Bhandar rasmalai": [
      "Rasmalai is made of small soft chhana balls soaked in thick, sweetened milk. Matri Bhandar at Monoharpur has made it since around 1930 and is the shop everyone means when they say 'Cumilla rasmalai'.\n\nThere is often a queue, and they sell only what they make each day.",
      "Any time of year.",
      "At Monoharpur, near the Kandirpar area of Cumilla city.",
      "Many highway shops copy the name. The real one is the small shop at Monoharpur.",
    ],
  },
  "coxs-bazar": {
    "Cox's Bazar beach": [
      "The beach runs unbroken for about 120 km from Cox's Bazar town to Teknaf. Its sand is firm and gently sloping, with low hills behind.\n\nLaboni, Sugandha and Kolatoli points near the town are the busiest, with beach chairs, horse rides and jet skis. Walk a little further and it becomes quiet.",
      "November to March.",
      "About an hour by air from Dhaka, or 9 to 10 hours by road or train.",
      "Swim only between the flags and follow the lifeguards; there are strong currents.",
    ],
    "Inani beach": [
      "Inani is known for the dark coral stones that appear along the shore at low tide. The water is clearer than in town, and the beach is far less crowded.\n\nIt is a favourite stop on a drive down the Marine Drive.",
      "November to March, at low tide.",
      "About 25 km south of Cox's Bazar town on the Marine Drive, 45 minutes by car or jeep.",
    ],
    Himchari: [
      "Himchari National Park has a small waterfall and a hill with a long flight of steps to the top. From there you see the Marine Drive and the sea stretching both ways.\n\nThe waterfall is at its best in the rains.",
      "November to March for views; the rainy season for the waterfall.",
      "About 12 km south of Cox's Bazar town on the Marine Drive.",
    ],
    "Marine Drive": [
      "The Marine Drive runs about 80 km from Cox's Bazar to Teknaf, with the Bay of Bengal on one side and green hills on the other. It is one of the longest coastal roads in the world.\n\nStops on the way include Himchari, Inani, Patuartek and the fishing boats drawn up on the sand.",
      "November to March.",
      "Hire a jeep or CNG in Cox's Bazar town for a half or full day.",
    ],
    "Saint Martin's Island": [
      "Saint Martin's is a small coral island about 9 km off the tip of Teknaf. It has clear blue water, coconut palms and a relaxed fishing community.\n\nAt low tide you can walk to Chera Dwip at the southern end. The seafood is fresh and simple.",
      "November to February.",
      "By ship from Teknaf or Cox's Bazar in the winter season.",
      "The government limits visitor numbers and the months when ships run, to protect the coral. Check the current rules before you plan.",
    ],
    "Maheshkhali island": [
      "Maheshkhali is the only hilly island in Bangladesh. On its Mainak Hill stands the Adinath temple of Shiva, reached by a long stairway, with a Rakhine Buddhist pagoda nearby.\n\nThe island is also known for salt fields, betel leaf gardens and dried fish.",
      "November to March.",
      "About 20 minutes by speedboat from the jetty at Cox's Bazar town.",
    ],
    "Ramu Buddhist temples": [
      "Ramu has been a centre of Buddhism for centuries and has many monasteries of the Rakhine and Barua communities. The best known sights are the 100-foot reclining Buddha at Bhubon Shanti Vihar and the old wooden monasteries.\n\nSeveral temples were rebuilt after an attack in 2012.",
      "November to March.",
      "About 16 km east of Cox's Bazar town on the Chattogram road.",
      "Remove shoes and dress modestly.",
    ],
    "Burmese Market": [
      "The Burmese Market in Cox's Bazar town is run mostly by Rakhine women. Stalls sell handwoven cloth and bags, sandalwood, thanaka, pickles, dried fruit and shell crafts.\n\nIt is the best place in town for souvenirs.",
      "Any time; evenings are liveliest.",
      "In the town near the Buddhist temple area, by rickshaw.",
      "Bargaining is normal.",
    ],
    "Dulahazra Safari Park": [
      "This was the first safari park in Bangladesh, set in natural garjan forest. Tigers, lions, elephants, deer and crocodiles live in large enclosures, and buses take visitors around.\n\nIt is a pleasant break on the long road to Cox's Bazar.",
      "November to February.",
      "At Chakaria, about 50 km north of Cox's Bazar town on the Chattogram highway.",
      "Closed on Tuesdays.",
    ],
    "Seafood on the beach": [
      "In the evening, stalls at Sugandha and Laboni points lay out the day's catch on ice: crab, tiger prawns, squid, rupchanda (pomfret) and coral fish. You pick what you want and it is fried or grilled in front of you.\n\nRestaurants in town also serve loitta fry and dried-fish bhorta, two local favourites.",
      "November to March.",
      "Stalls at Sugandha and Laboni beach points in Cox's Bazar town.",
      "Ask the price per piece or by weight before ordering.",
    ],
  },
  feni: {
    "Muhuri Project": [
      "The Muhuri irrigation project dammed the Feni river near the sea, creating a wide lake. In winter thousands of migratory ducks arrive, and local boats take visitors out on the water.\n\nThe area also has fish farms and one of the country's first wind power plants.",
      "November to February.",
      "In Sonagazi upazila, about 30 km from Feni town.",
    ],
    "Bijoy Singh Dighi": [
      "Bijoy Singh Dighi is a very large pond said to have been dug several hundred years ago by a local king, Bijoy Singh. Tall trees and a walking path circle the water.\n\nIt is the favourite outing for people in Feni town.",
      "November to March.",
      "About 3 km from Feni town, by auto.",
    ],
  },
  khagrachhari: {
    "Alutila cave": [
      "The Alutila cave is a natural tunnel about 100 metres long through a hill. A cold stream runs along its floor, and you walk through in complete darkness with a burning torch.\n\nThe hill above gives a wide view of Khagrachhari town and the Chengi valley.",
      "November to February.",
      "About 8 km from Khagrachhari town on the Chattogram road.",
      "Wear sandals or shoes that can get wet. " + PERMIT,
    ],
    "Richhang waterfall": [
      "Richhang drops onto a long, smooth, sloping rock, and visitors slide down it into the pool below. The name comes from the Marma language.\n\nA paved path and steps lead down from the road through green hills.",
      "June to October for strong water; winter for easy walking.",
      "About 10 km from Khagrachhari town, near Alutila.",
      "The rock is slippery; slide carefully. " + PERMIT,
    ],
    "Debota Pukur": [
      "Debota Pukur, 'the pond of the gods', lies on a hilltop about 1,000 feet up. The Tripura people believe a god keeps it full, and it never dries.\n\nYou reach it by climbing a long stairway through forest.",
      "November to February.",
      "At Maischari, about 12 km from Khagrachhari town, then a climb on foot.",
      PERMIT,
    ],
    "Khagrachhari hanging bridge": [
      "The Parjatan park on the edge of Khagrachhari town has a hanging bridge over a small lake, with hill views all around. It is a relaxed place for an evening walk.\n\nNearby stalls sell hill fruit and handwoven cloth.",
      "November to February.",
      "In Khagrachhari town, near the Parjatan motel.",
    ],
    "The road to Sajek": [
      "Although Sajek Valley is in Rangamati district, the only road to it starts from Khagrachhari. The 70 km drive climbs through Dighinala and Baghaihat, past Tripura and Chakma villages.\n\nThe open-top jeeps called chander gari make it a thrilling ride.",
      "October to March.",
      "Jeeps leave from Khagrachhari town and join an escorted convoy from the Baghaihat army camp.",
      "Convoys leave at fixed times in the morning and afternoon; miss one and you wait for the next. " + PERMIT,
    ],
  },
  lakshmipur: {
    "Meghna river chars": [
      "Lakshmipur lies where the Meghna spreads out before the sea. Its chars are flat green islands of rice, soybean and coconut, home to fishing and farming families.\n\nA boat trip from Moju Chowdhury Hat shows the huge river and its island life.",
      "November to March.",
      "Boats leave from Moju Chowdhury Hat, about 10 km from Lakshmipur town.",
    ],
    "Khoa Sagar Dighi": [
      "Khoa Sagar Dighi at Dalal Bazar was dug by a zamindar in the 18th century. It is so wide that on a misty winter morning the far bank disappears, which gave it the name 'sea of fog'.\n\nThe ruins of the Dalal Bazar zamindar house are close by.",
      "November to February.",
      "At Dalal Bazar, about 6 km from Lakshmipur town.",
    ],
    "Ramgati riverbank": [
      "At Ramgati and nearby Alexander the land ends at the mouth of the Meghna. A long embankment gives wide views of the water and the fishing fleet.\n\nIn ilish season the ghats are full of boats and fish traders.",
      "November to March.",
      "About 45 km south of Lakshmipur town.",
    ],
  },
  noakhali: {
    "Nijhum Dwip": [
      "Nijhum Dwip, 'the silent island', rose from the sea in the last century. The forest department planted mangroves and released spotted deer, which now number in the thousands.\n\nIn winter the mudflats fill with migratory birds. You walk or take a boat through the creeks to find the deer at dawn and dusk.",
      "November to February.",
      "By overnight launch from Dhaka's Sadarghat to Hatiya, then by road and a short boat crossing.",
      "Places to stay are simple. Sea crossings are rough from April to September.",
    ],
    "Hatiya island": [
      "Hatiya is a large island in the mouth of the Meghna, formed and reshaped by the river. Its people farm, fish and raise buffalo.\n\nMost travelers pass through on the way to Nijhum Dwip, but the embankments, bazaars and wide skies are worth a day.",
      "November to February.",
      "By launch from Dhaka, or by sea-truck from Chairman Ghat in Noakhali.",
    ],
    "Gandhi Ashram": [
      "In 1946, after communal riots, Mahatma Gandhi walked from village to village in Noakhali for four months to bring peace. A local barrister gave his house at Joyag for the work.\n\nThe Gandhi Ashram Trust still runs development work there, and a museum shows photographs and objects from his visit.",
      "November to February.",
      "At Joyag in Sonaimuri upazila, about 25 km north of Noakhali town (Maijdee).",
    ],
    "Bajra Shahi Mosque": [
      "The Bajra Shahi Mosque was built in 1741 on the model of the mosques of Delhi. A zamindar later covered its walls and domes in mosaic made from pieces of china.\n\nIt stands beside a large pond and is still in daily use.",
      "November to February.",
      "At Bajra in Sonaimuri upazila, close to the Gandhi Ashram.",
      "Dress modestly and avoid prayer times.",
    ],
  },
  rangamati: {
    "Kaptai Lake": [
      "Kaptai Lake was made in 1960 when the Karnaphuli was dammed for hydro power. It flooded a huge area, including the old Chakma royal palace, and is now the largest lake in the country.\n\nGreen hills rise straight from the blue water. A day on a hired boat takes you to islands, Chakma villages, temples and waterfalls.",
      "October to March; August to October for full water.",
      "Rangamati town is 2.5 hours by road from Chattogram. Boats are hired at the Reserve Bazar and Parjatan ghats.",
      PERMIT,
    ],
    "Hanging Bridge": [
      "The 335-foot Jhulonto Bridge links two hills across an arm of Kaptai Lake at the Parjatan complex. It has become the symbol of Rangamati.\n\nBoats for lake trips leave from just below it.",
      "November to March. In high monsoon water the deck can go under.",
      "At the Parjatan complex, about 4 km from the centre of Rangamati town.",
      "There is a small entry ticket.",
    ],
    "Sajek Valley": [
      "Sajek is a ridge about 1,800 feet up on the border with Mizoram, home to Lushai, Tripura and Pankhua families. The villages of Ruilui and Konglak look out over rolling hills in every direction.\n\nAt dawn, cloud fills the valleys below. Wooden cottages and resorts line the single road.",
      "October to March for clear skies; June to September for clouds.",
      "By jeep from Khagrachhari town (about 3 hours) with the army convoy from Baghaihat.",
      "Book your cottage ahead on weekends and holidays. Water is scarce, so use it carefully. " + PERMIT,
    ],
    "Shuvolong waterfall": [
      "Shuvolong falls about 300 feet down a rock face straight into Kaptai Lake. The boat ride there passes through a narrow gorge with steep green walls.\n\nIn the monsoon the waterfall is powerful; by late winter it thins to a trickle.",
      "July to October.",
      "About 1.5 hours by boat from Rangamati town.",
    ],
    "Rajban Vihara": [
      "Rajban Vihara is the main monastery of the Chakma Buddhists. It was founded in the 1970s around the monk Sadhanananda Mahathera, known as Bana Bhante, whose preserved body is kept here.\n\nThe Kathin Chibar Dan festival, when robes are woven in a single night and given to the monks, draws huge crowds each autumn.",
      "November, for the Kathin Chibar Dan festival; open all year.",
      "On the lake shore next to the Chakma king's island, a short way from the town centre.",
      "Remove shoes and dress modestly.",
    ],
    "Chakma Raj Palace": [
      "The Chakma are the largest of the hill peoples, and their raja still holds a traditional role. The present Rajbari stands on a small island; the older palace lies under the lake.\n\nYou can see the grounds, the royal office and a small Buddhist temple. The Chakma new year festival, Biju, is celebrated here in April.",
      "November to March; mid-April for Biju.",
      "A short boat crossing from Rangamati town, next to Rajban Vihara.",
    ],
    "Tribal Cultural Institute Museum": [
      "This small museum introduces the eleven or so communities of the Hill Tracts. It shows their handlooms, jewellery, musical instruments, baskets, weapons and old coins.\n\nIt is a helpful first stop to understand who lives in these hills.",
      "Any time of year.",
      "In Rangamati town, on the main road.",
    ],
    "Kaptai National Park": [
      "Kaptai National Park protects old teak plantations and natural forest between the Karnaphuli river and the hills. Wild elephants, monkeys and many forest birds live here.\n\nThe road from Kaptai to Rangamati through the hills is beautiful, and you can kayak on the river at Kaptai.",
      "November to March.",
      "Around Kaptai town, about 1.5 hours from Chattogram or from Rangamati.",
      "Go with a guide on forest trails; elephants use them too.",
    ],
    "Peda Ting Ting": [
      "Peda Ting Ting means 'full stomach' in Chakma. This restaurant sits on its own small island in Kaptai Lake and is a regular lunch stop on boat trips.\n\nIt serves hill dishes such as bamboo chicken, fish cooked in bamboo, and vegetables with local herbs, in thatched huts by the water.",
      "October to March.",
      "About 20 minutes by boat from Rangamati town, on the way to Shuvolong.",
    ],
  },
};
