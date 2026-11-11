import { p, type PlaceSeed } from "./types";

// Rajshahi (8), Rangpur (8) and Mymensingh (4) divisions
export const NORTH_PLACES: Record<string, PlaceSeed[]> = {
  // ---- Rajshahi ----
  bogura: [
    p("Mahasthangarh", "SIGHT", "The oldest known city in Bangladesh, from at least the 3rd century BC, with walls you can walk along.", "Closed on Sundays.", "Mahasthangarh"),
    p("Mahasthan Museum", "SIGHT", "Finds from the ancient city: terracotta, coins and sculptures.", undefined, "Mahasthangarh museum"),
    p("Behular Bashor Ghar", "SIGHT", "A large brick mound, linked in legend to Behula and Lakhindar.", undefined, "Gokul Medh"),
    p("Vasu Vihara", "SIGHT", "The ruins of a Buddhist monastery near Mahasthangarh.", undefined, "Vasu Vihara"),
    p("Kherua Mosque", "RELIGIOUS", "A three-domed mosque from 1582, still in use.", undefined, "Kherua Mosque"),
    p("Bogura doi", "FOOD", "Bogura's sweet, creamy doi (yogurt) in clay pots is famous across the country; Akbaria is a well-known shop.", undefined, "Mishti doi"),
  ],
  joypurhat: [
    p("Lakma Rajbari", "SIGHT", "A ruined zamindar palace close to the Indian border.", undefined, "Lakma Rajbari"),
  ],
  naogaon: [
    p("Somapura Mahavihara, Paharpur", "SIGHT", "One of the largest Buddhist monasteries south of the Himalayas, a UNESCO World Heritage Site.", "Closed on Sundays. The museum is worth the time.", "Somapura Mahavihara"),
    p("Kusumba Mosque", "RELIGIOUS", "A grey-stone mosque from 1558, once on the five-taka note.", undefined, "Kusumba Mosque"),
    p("Jagaddal Vihara", "SIGHT", "Remains of another great Buddhist monastery.", undefined, "Jagaddala Mahavihara"),
    p("Dibar Dighi", "SIGHT", "A large reservoir with a tall stone pillar standing in the water.", undefined, "Dibar Dighi"),
    p("Bhimer Panti", "SIGHT", "An ancient stone pillar at Dhamoirhat.", undefined, "Bhimer Panti"),
    p("Patisar Kachharibari", "SIGHT", "Tagore's estate office at Atrai, now a museum.", undefined, "Patisar"),
  ],
  natore: [
    p("Natore Rajbari", "SIGHT", "The palace of Rani Bhabani, the famous 18th-century woman zamindar.", undefined, "Natore Rajbari"),
    p("Uttara Gonobhaban", "SIGHT", "The Dighapatia palace, with gardens and rare trees.", undefined, "Uttara Gonobhaban"),
    p("Chalan Beel", "NATURE", "A huge wetland, full of water and boats in the monsoon.", undefined, "Chalan Beel"),
    p("Halti Beel", "NATURE", "A wetland with a road across it, very popular in the monsoon.", undefined, "Halti Beel"),
    p("Natore kacha golla", "FOOD", "A soft, crumbly sweet made from fresh chhana, Natore's speciality.", undefined, "Kacha golla"),
  ],
  "chapai-nawabganj": [
    p("Choto Sona Mosque", "RELIGIOUS", "A finely carved 15th-century stone mosque from the old city of Gaur.", undefined, "Choto Sona Mosque"),
    p("Darasbari Mosque", "RELIGIOUS", "The ruins of a large brick mosque from the Sultanate period.", undefined, "Darasbari Mosque"),
    p("Tahkhana", "SIGHT", "A Mughal-era palace beside a large pond.", undefined, "Tahkhana"),
    p("Shah Niamatullah's tomb", "RELIGIOUS", "The tomb of a Sufi saint, next to the Tahkhana.", undefined, "Shah Niamatullah"),
    p("Kansat mango market", "MARKET", "In June and July, one of the biggest mango markets in the country.", "Go in June for the best mangoes.", "Mango market Bangladesh"),
    p("Kalai ruti", "FOOD", "Flatbread made from black gram flour, eaten with chili paste and bhorta.", undefined, "Kalai ruti"),
  ],
  pabna: [
    p("Hardinge Bridge", "SIGHT", "A 1915 railway bridge over the Padma, next to the newer Lalon Shah Bridge.", undefined, "Hardinge Bridge"),
    p("Jor Bangla temple", "RELIGIOUS", "A twin-roofed terracotta temple in Pabna town.", undefined, "Jor Bangla temple Pabna"),
    p("Suchitra Sen's house", "SIGHT", "The childhood home of the film star Suchitra Sen.", undefined, "Suchitra Sen"),
    p("Chatmohar Shahi Mosque", "RELIGIOUS", "A three-domed mosque from 1581.", undefined, "Chatmohar"),
    p("Satsang Ashram", "RELIGIOUS", "The ashram of Sri Sri Anukul Chandra at Hemayetpur.", undefined, "Anukulchandra"),
    p("Pabna ghee", "FOOD", "Pabna is known for its pure ghee from its dairy farms.", undefined, "Ghee"),
  ],
  rajshahi: [
    p("Puthia temple complex", "RELIGIOUS", "The largest group of old Hindu temples in Bangladesh, around a palace and ponds.", undefined, "Puthia temple"),
    p("Varendra Research Museum", "SIGHT", "The oldest museum in Bangladesh, with fine sculptures and terracotta.", undefined, "Varendra Research Museum"),
    p("Padma riverbank", "NATURE", "A long riverside walk with tea stalls; take a boat to the char at sunset.", undefined, "Padma river Rajshahi"),
    p("Bagha Mosque", "RELIGIOUS", "A 16th-century mosque with ten domes and rich terracotta, once on the 50-taka note.", undefined, "Bagha Mosque"),
    p("Shah Makhdum shrine", "RELIGIOUS", "The shrine of Rajshahi's patron saint, near the river.", undefined, "Shah Makhdum"),
    p("Rajshahi silk", "MARKET", "Watch silk being woven and buy saris and scarves at the factories in Sapura.", undefined, "Rajshahi silk"),
    p("Rajshahi mangoes", "FOOD", "Rajshahi's mangoes, like himsagar and langra, are the best in the country in June and July.", undefined, "Mango Rajshahi"),
    p("Kalai ruti", "FOOD", "Rajshahi's street breakfast: black gram flatbread with spicy bhorta.", undefined, "Kalai ruti"),
  ],
  sirajganj: [
    p("Jamuna Bridge", "SIGHT", "One of the longest bridges in South Asia, crossing the mighty Jamuna.", undefined, "Jamuna Bridge"),
    p("Rabindra Kachharibari, Shahzadpur", "SIGHT", "Tagore's estate house, now a museum.", undefined, "Shahzadpur Kachharibari"),
    p("Navaratna temple, Hatikumrul", "RELIGIOUS", "A nine-spired terracotta temple from the 18th century.", undefined, "Hatikumrul Navaratna"),
    p("Hard Point riverfront", "NATURE", "A riverside promenade on the Jamuna, busy at sunset.", undefined, "Sirajganj Jamuna"),
    p("Sirajganj handloom", "MARKET", "Belkuchi and Enayetpur are major handloom centres for saris and lungis.", undefined, "Handloom Bangladesh"),
  ],

  // ---- Rangpur ----
  dinajpur: [
    p("Kantajew Temple", "RELIGIOUS", "An 18th-century temple covered in terracotta panels telling stories from the epics.", undefined, "Kantajew Temple"),
    p("Ramsagar", "NATURE", "A huge 18th-century reservoir with a park around it.", undefined, "Ramsagar"),
    p("Dinajpur Rajbari", "SIGHT", "The ruins of the Dinajpur rajas' palace.", undefined, "Dinajpur Rajbari"),
    p("Nayabad Mosque", "RELIGIOUS", "A small three-domed terracotta mosque near the Kantajew Temple.", undefined, "Nayabad Mosque"),
    p("Singra forest", "NATURE", "A sal forest with walking trails.", undefined, "Singra National Park"),
    p("Dinajpur litchis", "FOOD", "Dinajpur's litchis are famous; buy them by the bunch in May and June.", undefined, "Lychee"),
  ],
  gaibandha: [
    p("Balashi ghat", "EXPERIENCE", "A ghat on the Brahmaputra where boats leave for the char islands.", undefined, "Balashi ghat"),
    p("Brahmaputra chars", "NATURE", "Sandbank islands where people farm and live with the river.", undefined, "Brahmaputra char"),
    p("Bardhankuthi", "SIGHT", "The ruins of an old zamindar house at Govindaganj.", undefined, "Bardhankuthi"),
    p("Roshmanjuri", "FOOD", "Gaibandha's famous sweet: small chhana balls in thick, sweet milk.", undefined, "Rasmalai"),
  ],
  kurigram: [
    p("Chilmari river port", "EXPERIENCE", "An old port on the Brahmaputra, famous in folk songs.", undefined, "Chilmari"),
    p("Brahmaputra chars", "NATURE", "Kurigram has hundreds of char islands; spend a day with a char family.", undefined, "Brahmaputra char Kurigram"),
    p("Dharla river", "NATURE", "A quiet river with a long bridge near Kurigram town.", undefined, "Dharla river"),
  ],
  lalmonirhat: [
    p("Teesta Barrage", "SIGHT", "The country's biggest irrigation barrage, with river views.", undefined, "Teesta Barrage"),
    p("Tin Bigha corridor", "SIGHT", "A narrow strip of land connecting the Dahagram enclave to the rest of Bangladesh.", undefined, "Tin Bigha"),
    p("Burimari land port", "EXPERIENCE", "A border crossing towards India and Bhutan.", undefined, "Burimari"),
    p("Kakina Zamindar Bari", "SIGHT", "The remains of the Kakina zamindars' house.", undefined, "Kakina"),
  ],
  nilphamari: [
    p("Nilsagar", "NATURE", "A large ancient reservoir with birds in winter.", undefined, "Nilsagar"),
    p("Saidpur railway town", "SIGHT", "A British-era railway workshop town with old colonial buildings.", undefined, "Saidpur railway"),
    p("Chini Mosque, Saidpur", "RELIGIOUS", "A mosque decorated with pieces of china.", undefined, "Chini Mosque Saidpur"),
  ],
  panchagarh: [
    p("Kanchenjunga view, Tetulia", "NATURE", "On clear mornings from October to December you can see Kanchenjunga, the world's third-highest peak.", "Go at sunrise on a clear day in late autumn.", "Tetulia Kanchenjunga"),
    p("Tetulia Dak Bungalow", "SIGHT", "An old British rest house on a ridge above the Mahananda river.", undefined, "Tetulia"),
    p("Panchagarh tea gardens", "NATURE", "Flat-land tea gardens, unusual in Bangladesh.", undefined, "Panchagarh tea garden"),
    p("Mahananda river stone collectors", "EXPERIENCE", "Watch people collecting stones from the clear, shallow river on the border.", undefined, "Mahananda river"),
    p("Banglabandha zero point", "SIGHT", "The northernmost point of Bangladesh, a land port with India.", undefined, "Banglabandha"),
    p("Bhitargarh", "SIGHT", "The remains of a large early fort city.", undefined, "Bhitargarh"),
  ],
  rangpur: [
    p("Tajhat Palace", "SIGHT", "A white marble zamindar palace from the early 1900s, now a museum.", undefined, "Tajhat Palace"),
    p("Begum Rokeya's home", "SIGHT", "The birthplace at Pairaband of Begum Rokeya, pioneer of women's education.", undefined, "Begum Rokeya"),
    p("Carmichael College", "SIGHT", "A beautiful old college campus with Indo-Saracenic buildings.", undefined, "Carmichael College"),
    p("Vinnya Jagat", "NATURE", "A large theme park with gardens and rides.", undefined, "Vinnya Jagat"),
    p("Nisbetganj shatranji weavers", "MARKET", "Hand-woven shatranji rugs, a craft hundreds of years old.", undefined, "Shatranji"),
    p("Haribhanga mango", "FOOD", "Rangpur's own mango variety, in season in June and July.", undefined, "Mango Bangladesh"),
  ],
  thakurgaon: [
    p("Baliadangi giant mango tree", "NATURE", "A single mango tree spreading over about two bighas of land.", undefined, "Thakurgaon mango tree"),
    p("Jamalpur Zamindar Mosque", "RELIGIOUS", "A richly decorated zamindar-era mosque.", undefined, "Jamalpur Zamindar Mosque Thakurgaon"),
    p("Haripur Rajbari", "SIGHT", "The remains of a zamindar palace near the border.", undefined, "Haripur Rajbari"),
    p("Ramrai Dighi", "NATURE", "A large old reservoir surrounded by trees.", undefined, "Ramrai Dighi"),
  ],

  // ---- Mymensingh ----
  jamalpur: [
    p("Lauchapra", "NATURE", "Low hills on the Garo Hills border with a viewing tower and forest.", undefined, "Lauchapra"),
    p("Old Brahmaputra", "NATURE", "Quiet riverbanks and boats on the old course of the Brahmaputra.", undefined, "Old Brahmaputra"),
    p("Dayamoyee Temple", "RELIGIOUS", "A well-known old temple in Jamalpur town.", undefined, "Jamalpur Bangladesh"),
    p("Nakshi kantha", "MARKET", "Jamalpur's women embroider beautiful nakshi kantha quilts; buy from local groups.", undefined, "Nakshi kantha"),
  ],
  mymensingh: [
    p("Zainul Abedin Museum", "SIGHT", "Paintings by Zainul Abedin, the father of modern art in Bangladesh, on the Brahmaputra bank.", undefined, "Zainul Abedin Museum"),
    p("Shoshi Lodge", "SIGHT", "A grand zamindar palace with a marble fountain and gardens.", undefined, "Shoshi Lodge"),
    p("Muktagacha Zamindar Bari", "SIGHT", "A large, crumbling zamindar estate with temples and courtyards.", undefined, "Muktagacha Zamindar Bari"),
    p("Alexander Castle", "SIGHT", "A 19th-century mansion built for a visit by the Viceroy, now a teachers' college.", undefined, "Alexander Castle"),
    p("Bangladesh Agricultural University", "NATURE", "A huge green campus with a botanical garden on the Old Brahmaputra.", undefined, "Bangladesh Agricultural University"),
    p("Old Brahmaputra riverside", "NATURE", "A long riverside park, lovely in the evening.", undefined, "Old Brahmaputra Mymensingh"),
    p("Muktagacha monda", "FOOD", "A famous soft sweet sold by the same Gopal Pal family shop for about two hundred years.", undefined, "Monda sweet"),
  ],
  netrokona: [
    p("Birisiri china clay hills", "NATURE", "White clay hills with blue-green lakes at Bijoypur.", undefined, "Birisiri"),
    p("Someshwari river", "NATURE", "A clear, shallow river below the Garo Hills.", undefined, "Someshwari river"),
    p("Birisiri Tribal Cultural Academy", "SIGHT", "The culture of the Garo and Hajong people of the area.", undefined, "Birisiri cultural academy"),
    p("Ranikhong Mission", "RELIGIOUS", "A hilltop Catholic mission church above the Someshwari.", undefined, "Ranikhong"),
    p("Balish mishti", "FOOD", "Netrokona's 'pillow sweet', a large soft sweet first made by Gayanath Mistanna Bhandar.", undefined, "Balish mishti"),
  ],
  sherpur: [
    p("Gajni hills", "NATURE", "Forested hills on the Meghalaya border with a lake, towers and trails.", undefined, "Gajni Sherpur"),
    p("Madhutila Eco Park", "NATURE", "Hills, a lake and a watchtower in sal forest.", undefined, "Madhutila"),
    p("Garo villages", "EXPERIENCE", "Visit the Garo communities of the hill foothills.", undefined, "Garo people"),
    p("Tulshimala rice", "FOOD", "Sherpur's fragrant tulshimala rice, used for polao and pitha.", undefined, "Rice Bangladesh"),
  ],
};
