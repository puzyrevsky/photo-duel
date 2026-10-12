import React, { useState, useCallback } from 'react';
import './App.css';

const App = () => {
  const [photos, setPhotos] = useState([]);
  const [tournamentPhotos, setTournamentPhotos] = useState([]);
  const [currentRound, setCurrentRound] = useState([]);
  const [winners, setWinners] = useState([]);
  const [finalWinner, setFinalWinner] = useState(null);
  const [stage, setStage] = useState('upload'); // upload, tournament, finished

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

  // Перемешивание массива
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Начало турнира
  const startTournament = () => {
    if (photos.length < 2) {
      alert('Нужно минимум 2 фотографии для турнира!');
      return;
    }
    
    const shuffled = shuffleArray(photos);
    setTournamentPhotos(shuffled);
    
    // Разбиваем на пары
    const pairs = [];
    const workingPhotos = [...shuffled];
    
    while (workingPhotos.length >= 2) {
      const photo1 = workingPhotos.pop();
      const photo2 = workingPhotos.pop();
      pairs.push({
        id: `${Date.now()}-${Math.random()}`,
        photo1,
        photo2,
        winner: null
      });
    }
    
    // Если осталась одна фотография - делаем её "свободной"
    if (workingPhotos.length === 1) {
      pairs.push({
        id: `${Date.now()}-${Math.random()}`,
        photo1: workingPhotos[0],
        photo2: null,
        winner: null,
        isFree: true
      });
    }
    
    setCurrentRound(pairs);
    setStage('tournament');
    setWinners([]);
    setFinalWinner(null);
  };

  // Выбор победителя в паре
  const selectWinner = (pairId, winnerPhoto) => {
    setCurrentRound(prev => 
      prev.map(pair => 
        pair.id === pairId 
          ? { ...pair, winner: winnerPhoto }
          : pair
      )
    );
  };

  // Переход к следующему раунду
  const nextRound = () => {
    const roundWinners = [];
    
    currentRound.forEach(pair => {
      if (pair.isFree) {
        // Свободная фотография проходит дальше
        roundWinners.push(pair.photo1);
      } else if (pair.winner) {
        roundWinners.push(pair.winner);
      }
    });
    
    if (roundWinners.length === 0) {
      alert('Выберите победителей во всех парах!');
      return;
    }
    
    if (roundWinners.length === 1) {
      // У нас есть победитель!
      setFinalWinner(roundWinners[0]);
      setStage('finished');
      return;
    }
    
    // Формируем новый раунд
    const shuffled = shuffleArray(roundWinners);
    const pairs = [];
    const workingPhotos = [...shuffled];
    
    while (workingPhotos.length >= 2) {
      const photo1 = workingPhotos.pop();
      const photo2 = workingPhotos.pop();
      pairs.push({
        id: `${Date.now()}-${Math.random()}`,
        photo1,
        photo2,
        winner: null
      });
    }
    
    if (workingPhotos.length === 1) {
      pairs.push({
        id: `${Date.now()}-${Math.random()}`,
        photo1: workingPhotos[0],
        photo2: null,
        winner: null,
        isFree: true
      });
    }
    
    setCurrentRound(pairs);
    setWinners(prev => [...prev, ...roundWinners]);
  };

  // Сброс турнира
  const resetTournament = () => {
    setPhotos([]);
    setTournamentPhotos([]);
    setCurrentRound([]);
    setWinners([]);
    setFinalWinner(null);
    setStage('upload');
  };

  // Удаление фотографии из загрузки
  const removePhoto = (id) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  // Проверка, все ли пары имеют победителей
  const allPairsHaveWinners = currentRound.every(pair => 
    pair.isFree || pair.winner !== null
  );

  // Компонент карточки фотографии
  const PhotoCard = ({ photo, onSelect, isSelected, showPlusButton, isFree }) => (
    <div className={`photo-card ${isFree ? 'free' : ''} ${isSelected ? 'selected' : ''}`}>
      <div className="photo-wrapper">
        <img src={photo.url} alt={photo.name} />
        {isFree && <div className="free-overlay">Свободна</div>}
      </div>
      {showPlusButton && !isFree && (
        <button 
          className="select-button"
          onClick={() => onSelect(photo)}
          aria-label="Выбрать победителя"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
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
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="file-input"
              />
              <div className="upload-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
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
                      <button 
                        className="remove-button"
                        onClick={() => removePhoto(photo.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  className="start-button"
                  onClick={startTournament}
                  disabled={photos.length < 2}
                >
                  Начать турнир
                </button>
              </div>
            )}
          </div>
        )}

        {stage === 'tournament' && (
          <div className="tournament-stage">
            <div className="round-info">
              <h2>Раунд {winners.length / 2 + 1}</h2>
              <p>Выберите победителя в каждой паре</p>
            </div>

            <div className="pairs-container">
              {currentRound.map((pair, index) => (
                <div key={pair.id} className="pair">
                  <div className="pair-number">Пара {index + 1}</div>
                  <div className="pair-content">
                    <PhotoCard
                      photo={pair.photo1}
                      onSelect={(photo) => selectWinner(pair.id, photo)}
                      isSelected={pair.winner?.id === pair.photo1.id}
                      showPlusButton={true}
                      isFree={pair.isFree}
                    />
                    {pair.photo2 && (
                      <>
                        <div className="vs">VS</div>
                        <PhotoCard
                          photo={pair.photo2}
                          onSelect={(photo) => selectWinner(pair.id, photo)}
                          isSelected={pair.winner?.id === pair.photo2.id}
                          showPlusButton={true}
                          isFree={false}
                        />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button 
              className="next-round-button"
              onClick={nextRound}
              disabled={!allPairsHaveWinners}
            >
              {currentRound.filter(p => !p.isFree).length === 1 && currentRound.filter(p => p.winner).length === 1
                ? 'Показать победителя'
                : 'Следующий раунд'}
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