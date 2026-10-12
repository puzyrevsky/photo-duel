import React, { useState } from 'react';
import './App.css';

const App = () => {
  const [photos, setPhotos] = useState([]);
  const [currentRound, setCurrentRound] = useState([]);
  const [roundNumber, setRoundNumber] = useState(1);
  const [finalWinner, setFinalWinner] = useState(null);
  const [stage, setStage] = useState('upload');

  // Загрузка фотографий
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos(prev => [...prev, {
          id: `${Date.now()}-${Math.random()}`,
          url: event.target.result,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Перемешивание
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Ближайшая степень двойки сверху
  const nextPowerOfTwo = (n) => {
    let p = 1;
    while (p < n) p *= 2;
    return p;
  };

  // Разбить массив фото на раунд: вернёт { pairs, freePhotos }
  const buildRound = (photoList, isFirstRound) => {
    const shuffled = shuffleArray(photoList);
    const pairs = [];
    let freePhotos = [];

    if (isFirstRound) {
      // В первом раунде освобождаем столько, чтобы оставшиеся + освобождённые
      // в след. раунде дали степень двойки
      const N = shuffled.length;
      const target = nextPowerOfTwo(N); // ближайшая степень 2 сверху
      const freeCount = target - N;
      
      const working = [...shuffled];
      // Освобождаем freeCount случайных фото
      freePhotos = working.splice(0, freeCount);
      
      // Остальные разбиваем на пары
      while (working.length >= 2) {
        const photo1 = working.pop();
        const photo2 = working.pop();
        pairs.push({
          id: `${Date.now()}-${Math.random()}`,
          photo1,
          photo2,
          winner: null,
        });
      }
    } else {
      // В последующих раундах всё чётное, освобождённых нет
      const working = [...shuffled];
      while (working.length >= 2) {
        const photo1 = working.pop();
        const photo2 = working.pop();
        pairs.push({
          id: `${Date.now()}-${Math.random()}`,
          photo1,
          photo2,
          winner: null,
        });
      }
    }

    return { pairs, freePhotos };
  };

  const startTournament = () => {
    if (photos.length < 2) {
      alert('Нужно минимум 2 фотографии!');
      return;
    }
    const { pairs, freePhotos } = buildRound(photos, true);
    setCurrentRound({ pairs, freePhotos });
    setRoundNumber(1);
    setStage('tournament');
    setFinalWinner(null);
  };

  const selectWinner = (pairId, winnerPhoto) => {
    setCurrentRound(prev => ({
      ...prev,
      pairs: prev.pairs.map(pair =>
        pair.id === pairId ? { ...pair, winner: winnerPhoto } : pair
      ),
    }));
  };

  const nextRound = () => {
    const { pairs, freePhotos } = currentRound;

    const roundWinners = [];
    pairs.forEach(pair => {
      if (pair.winner) roundWinners.push(pair.winner);
    });

    // Добавляем освобождённых (только в первом раунде)
    const allAdvancing = [...roundWinners, ...freePhotos];

    if (allAdvancing.length === 1) {
      setFinalWinner(allAdvancing[0]);
      setStage('finished');
      return;
    }

    const { pairs: newPairs, freePhotos: newFree } = buildRound(allAdvancing, false);

    // Проверка: если после разбивки остался кто-то лишний (нечёт) — добавляем в free
    // (по логике не должно случиться, но на всякий)
    setCurrentRound({ pairs: newPairs, freePhotos: newFree });
    setRoundNumber(prev => prev + 1);
  };

  const resetTournament = () => {
    setPhotos([]);
    setCurrentRound([]);
    setRoundNumber(1);
    setFinalWinner(null);
    setStage('upload');
  };

  const removePhoto = (id) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const { pairs = [], freePhotos = [] } = currentRound;
  const allPairsHaveWinners = pairs.length > 0 && pairs.every(p => p.winner !== null);

  // Сколько фото в этом раунде
  const totalInRound = pairs.length * 2 + freePhotos.length;
  const isFinalRound = totalInRound === 2;

  // Компонент карточки
  const PhotoCard = ({ photo, onSelect, isSelected, isFree }) => (
    <div className={`photo-card ${isFree ? 'free' : ''} ${isSelected ? 'selected' : ''}`}>
      <div className="photo-wrapper">
        <img src={photo.url} alt={photo.name} />
      </div>
      {!isFree && (
        <button
          className="select-button"
          onClick={() => onSelect(photo)}
          aria-label="Выбрать победителя"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}
    </div>
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>🏆 Фототурнир</h1>
        {stage !== 'upload' && (
          <button className="reset-button" onClick={resetTournament}>
            Начать заново
          </button>
        )}
      </header>

      <main className="app-main">
        {stage === 'upload' && (
          <div className="upload-stage">
            <label className="upload-zone">
              <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="file-input" />
              <div className="upload-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p>Нажмите или перетащите фотографии</p>
                <span>Можно выбрать сразу несколько</span>
              </div>
            </label>

            {photos.length > 0 && (
              <div className="uploaded-photos">
                <h2>Загружено: {photos.length}</h2>
                <div className="photos-grid">
                  {photos.map(photo => (
                    <div key={photo.id} className="uploaded-photo">
                      <img src={photo.url} alt={photo.name} />
                      <button className="remove-button" onClick={() => removePhoto(photo.id)}>×</button>
                    </div>
                  ))}
                </div>
                <button className="start-button" onClick={startTournament} disabled={photos.length < 2}>
                  Начать турнир
                </button>
              </div>
            )}
          </div>
        )}

        {stage === 'tournament' && (
          <div className="tournament-stage">
            <div className="round-info">
              <h2>Раунд {roundNumber}</h2>
              <p>Выберите победителя в каждой паре</p>
            </div>

            <div className="pairs-container">
              {pairs.map((pair, index) => (
                <div key={pair.id} className="pair">
                  <div className="pair-number">Пара {index + 1}</div>
                  <div className="pair-content">
                    <PhotoCard
                      photo={pair.photo1}
                      onSelect={(photo) => selectWinner(pair.id, photo)}
                      isSelected={pair.winner?.id === pair.photo1.id}
                      isFree={false}
                    />
                    <div className="vs">VS</div>
                    <PhotoCard
                      photo={pair.photo2}
                      onSelect={(photo) => selectWinner(pair.id, photo)}
                      isSelected={pair.winner?.id === pair.photo2.id}
                      isFree={false}
                    />
                  </div>
                </div>
              ))}

              {freePhotos.length > 0 && (
                <div className="pair free-pair">
                  <div className="pair-number">
                    🎫 Освобождены от игры (пройдут автоматически)
                  </div>
                  <div className="pair-content free-content">
                    {freePhotos.map(photo => (
                      <PhotoCard key={photo.id} photo={photo} isFree={true} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button className="next-round-button" onClick={nextRound} disabled={!allPairsHaveWinners}>
              {isFinalRound ? 'Показать победителя' : 'Следующий раунд'}
            </button>
          </div>
        )}

        {stage === 'finished' && finalWinner && (
          <div className="finished-stage">
            <div className="winner-display">
              <div className="trophy">🏆</div>
              <h2>Победитель!</h2>
              <div className="winner-photo">
                <img src={finalWinner.url} alt={finalWinner.name} />
                <div className="winner-crown">👑</div>
              </div>
              <p className="winner-name">{finalWinner.name}</p>
            </div>
            <button className="reset-button large" onClick={resetTournament}>
              Новый турнир
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;