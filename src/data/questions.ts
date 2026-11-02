import type { CategoryId } from '../game/types/match';
import type { Difficulty, Question } from '../game/types/question';

const q = (
  id: string,
  categoryId: CategoryId,
  difficulty: Difficulty,
  prompt: string,
  answer: string,
  incorrect: [string, string, string],
): Question => ({ id, categoryId, difficulty, prompt, answer, incorrect });

/**
 * Local question fixtures: 8 per category (3 easy, 3 medium, 2 hard). `answer` is the correct
 * option; option order is shuffled per match by seed (src/game/battle/questions.ts).
 */
export const QUESTIONS: readonly Question[] = [
  q('sci-e1', 'science', 'easy', 'What is the chemical formula for water?', 'H2O', ['CO2', 'O2', 'NaCl']),
  q('sci-e2', 'science', 'easy', 'Which gas do plants absorb from the air for photosynthesis?', 'Carbon dioxide', ['Oxygen', 'Nitrogen', 'Helium']),
  q('sci-e3', 'science', 'easy', 'How many bones are in a typical adult human body?', '206', ['186', '226', '256']),
  q('sci-m1', 'science', 'medium', 'What is the chemical symbol for gold?', 'Au', ['Ag', 'Gd', 'Go']),
  q('sci-m2', 'science', 'medium', 'In an animal cell, which structure holds most of the DNA?', 'Nucleus', ['Ribosome', 'Cell membrane', 'Vacuole']),
  q('sci-m3', 'science', 'medium', "Which gas makes up most of Earth's atmosphere?", 'Nitrogen', ['Oxygen', 'Carbon dioxide', 'Argon']),
  q('sci-h1', 'science', 'hard', 'What is the SI unit of electrical resistance?', 'Ohm', ['Volt', 'Ampere', 'Watt']),
  q('sci-h2', 'science', 'hard', 'Which element has the chemical symbol K?', 'Potassium', ['Krypton', 'Calcium', 'Phosphorus']),

  q('spo-e1', 'sports', 'easy', 'How many players does each team have on the field in association football (soccer)?', '11', ['9', '10', '12']),
  q('spo-e2', 'sports', 'easy', 'Which sport uses a shuttlecock?', 'Badminton', ['Tennis', 'Squash', 'Volleyball']),
  q('spo-e3', 'sports', 'easy', 'How many rings appear on the Olympic flag?', '5', ['4', '6', '7']),
  q('spo-m1', 'sports', 'medium', 'In tennis, what is a score of zero called?', 'Love', ['Nil', 'Duck', 'Blank']),
  q('spo-m2', 'sports', 'medium', 'How many holes are played in a standard round of golf?', '18', ['9', '12', '21']),
  q('spo-m3', 'sports', 'medium', 'In which city were the first modern Olympic Games held in 1896?', 'Athens', ['Paris', 'London', 'Rome']),
  q('spo-h1', 'sports', 'hard', 'Which country won the first FIFA World Cup in 1930?', 'Uruguay', ['Argentina', 'Brazil', 'Italy']),
  q('spo-h2', 'sports', 'hard', 'What is the official distance of a marathon?', '42.195 km', ['40 km', '41.5 km', '43.2 km']),

  q('his-e1', 'history', 'easy', 'Who was the first President of the United States?', 'George Washington', ['Thomas Jefferson', 'Abraham Lincoln', 'John Adams']),
  q('his-e2', 'history', 'easy', 'Which civilization built the Great Pyramid of Giza?', 'Ancient Egyptians', ['Ancient Romans', 'Ancient Greeks', 'Persians']),
  q('his-e3', 'history', 'easy', 'In which year did World War II end?', '1945', ['1939', '1944', '1950']),
  q('his-m1', 'history', 'medium', 'Which wall, a symbol of the Cold War, fell in 1989?', 'Berlin Wall', ["Hadrian's Wall", 'Great Wall of China', 'Western Wall']),
  q('his-m2', 'history', 'medium', 'Which ocean liner sank on its maiden voyage in 1912?', 'Titanic', ['Lusitania', 'Britannic', 'Olympic']),
  q('his-m3', 'history', 'medium', 'Who became the first Roman emperor in 27 BC?', 'Augustus', ['Julius Caesar', 'Nero', 'Caligula']),
  q('his-h1', 'history', 'hard', 'In which year did the French Revolution begin?', '1789', ['1776', '1804', '1815']),
  q('his-h2', 'history', 'hard', 'Genghis Khan founded which empire?', 'Mongol Empire', ['Ottoman Empire', 'Byzantine Empire', 'Mughal Empire']),

  q('mov-e1', 'movies-tv', 'easy', 'Which school of witchcraft and wizardry does Harry Potter attend?', 'Hogwarts', ['Durmstrang', 'Beauxbatons', 'Ilvermorny']),
  q('mov-e2', 'movies-tv', 'easy', 'What is the name of the cowboy toy in Toy Story?', 'Woody', ['Buzz Lightyear', 'Rex', 'Hamm']),
  q('mov-e3', 'movies-tv', 'easy', "In The Lion King (1994), what is the name of Simba's father?", 'Mufasa', ['Scar', 'Rafiki', 'Zazu']),
  q('mov-m1', 'movies-tv', 'medium', "Which film series is known for the line 'May the Force be with you'?", 'Star Wars', ['Star Trek', 'Dune', 'The Matrix']),
  q('mov-m2', 'movies-tv', 'medium', 'What is the name of the fictional African nation in Black Panther?', 'Wakanda', ['Zamunda', 'Genovia', 'Sokovia']),
  q('mov-m3', 'movies-tv', 'medium', 'Which TV series features House Targaryen and its dragons?', 'Game of Thrones', ['The Witcher', 'Vikings', 'The Crown']),
  q('mov-h1', 'movies-tv', 'hard', 'Who directed the 1993 film Jurassic Park?', 'Steven Spielberg', ['James Cameron', 'George Lucas', 'Ridley Scott']),
  q('mov-h2', 'movies-tv', 'hard', 'Which film won the first Academy Award for Best Animated Feature?', 'Shrek', ['Monsters, Inc.', 'Toy Story 2', 'Spirited Away']),

  q('spa-e1', 'space', 'easy', 'Which planet is known as the Red Planet?', 'Mars', ['Venus', 'Jupiter', 'Mercury']),
  q('spa-e2', 'space', 'easy', 'What is the largest planet in our Solar System?', 'Jupiter', ['Saturn', 'Neptune', 'Earth']),
  q('spa-e3', 'space', 'easy', 'What is the name of the galaxy that contains our Solar System?', 'Milky Way', ['Andromeda', 'Triangulum', 'Whirlpool']),
  q('spa-m1', 'space', 'medium', 'Who was the first person to walk on the Moon?', 'Neil Armstrong', ['Buzz Aldrin', 'Yuri Gagarin', 'John Glenn']),
  q('spa-m2', 'space', 'medium', 'How many planets are in our Solar System?', '8', ['7', '9', '10']),
  q('spa-m3', 'space', 'medium', 'What is the closest star to Earth?', 'The Sun', ['Proxima Centauri', 'Sirius', 'Polaris']),
  q('spa-h1', 'space', 'hard', 'Who was the first human to travel into space, in 1961?', 'Yuri Gagarin', ['Alan Shepard', 'John Glenn', 'Valentina Tereshkova']),
  q('spa-h2', 'space', 'hard', 'About how long does sunlight take to reach Earth?', 'About 8 minutes', ['About 8 seconds', 'About 1 hour', 'About 1 day']),

  q('tec-e1', 'technology', 'easy', 'What does CPU stand for?', 'Central Processing Unit', ['Computer Personal Unit', 'Central Program Utility', 'Core Power Unit']),
  q('tec-e2', 'technology', 'easy', 'Which company makes the iPhone?', 'Apple', ['Samsung', 'Google', 'Nokia']),
  q('tec-e3', 'technology', 'easy', "In a web address, what does 'www' stand for?", 'World Wide Web', ['World Wide Wire', 'Web World Wide', 'Wide Web World']),
  q('tec-m1', 'technology', 'medium', 'What does HTML stand for?', 'HyperText Markup Language', ['High Tech Modern Language', 'Hyperlink Text Management Language', 'Home Tool Markup Language']),
  q('tec-m2', 'technology', 'medium', 'How many bits are in a byte?', '8', ['4', '16', '10']),
  q('tec-m3', 'technology', 'medium', 'Who co-founded Microsoft with Paul Allen?', 'Bill Gates', ['Steve Jobs', 'Steve Wozniak', 'Larry Page']),
  q('tec-h1', 'technology', 'hard', 'Which programming language was created by Guido van Rossum?', 'Python', ['Java', 'Ruby', 'C++']),
  q('tec-h2', 'technology', 'hard', 'In which year was the first iPhone released?', '2007', ['2005', '2008', '2010']),

  q('geo-e1', 'geography', 'easy', 'What is the capital of France?', 'Paris', ['Lyon', 'Marseille', 'Nice']),
  q('geo-e2', 'geography', 'easy', 'Which is the largest ocean on Earth?', 'Pacific Ocean', ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean']),
  q('geo-e3', 'geography', 'easy', 'On which continent is Kenya?', 'Africa', ['Asia', 'South America', 'Australia']),
  q('geo-m1', 'geography', 'medium', 'What is the capital of Australia?', 'Canberra', ['Sydney', 'Melbourne', 'Perth']),
  q('geo-m2', 'geography', 'medium', 'Which major river flows through Cairo?', 'Nile', ['Amazon', 'Danube', 'Tigris']),
  q('geo-m3', 'geography', 'medium', 'Which country has the largest land area?', 'Russia', ['Canada', 'China', 'United States']),
  q('geo-h1', 'geography', 'hard', 'What is the smallest country in the world by area?', 'Vatican City', ['Monaco', 'San Marino', 'Liechtenstein']),
  q('geo-h2', 'geography', 'hard', 'What is the largest hot desert in the world?', 'Sahara', ['Arabian Desert', 'Gobi Desert', 'Kalahari Desert']),

  q('mus-e1', 'music', 'easy', 'How many strings does a standard guitar have?', '6', ['4', '5', '8']),
  q('mus-e2', 'music', 'easy', "Which band recorded 'Hey Jude'?", 'The Beatles', ['The Rolling Stones', 'Queen', 'The Who']),
  q('mus-e3', 'music', 'easy', 'Which instrument has 88 keys in its standard modern form?', 'Piano', ['Harp', 'Violin', 'Trumpet']),
  q('mus-m1', 'music', 'medium', "Who is known as the 'King of Pop'?", 'Michael Jackson', ['Elvis Presley', 'Prince', 'Justin Timberlake']),
  q('mus-m2', 'music', 'medium', 'How many lines are on a standard musical staff?', '5', ['4', '6', '7']),
  q('mus-m3', 'music', 'medium', "Which composer wrote the 'Moonlight Sonata'?", 'Ludwig van Beethoven', ['Wolfgang Amadeus Mozart', 'Johann Sebastian Bach', 'Frederic Chopin']),
  q('mus-h1', 'music', 'hard', "Which composer wrote 'The Four Seasons'?", 'Antonio Vivaldi', ['Johann Sebastian Bach', 'Joseph Haydn', 'George Frideric Handel']),
  q('mus-h2', 'music', 'hard', "Which Italian musical term means 'loud'?", 'Forte', ['Piano', 'Adagio', 'Lento']),
];
