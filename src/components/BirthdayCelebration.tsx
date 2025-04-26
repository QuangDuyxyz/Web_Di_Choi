
import { useEffect, useState } from 'react';
import { useBirthday } from '@/contexts/BirthdayContext';
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

export const BirthdayCelebration = () => {
  const { birthdayPeople, showCelebration, toggleCelebration } = useBirthday();
  const [confettiElements, setConfettiElements] = useState<JSX.Element[]>([]);
  
  useEffect(() => {
    if (showCelebration && birthdayPeople.length > 0) {
      // Trigger confetti effect when celebration is shown
      const colors = ['#FFDEE2', '#E5DEFF', '#D3E4FD', '#FDE1D3', '#FEF7CD'];
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors
      });
      
      // Create floating confetti elements
      const elements = [];
      for (let i = 0; i < 50; i++) {
        const left = Math.random() * 100;
        const animationDuration = 3 + Math.random() * 7;
        const size = 5 + Math.random() * 15;
        const colorIndex = Math.floor(Math.random() * colors.length);
        
        elements.push(
          <div
            key={i}
            className="confetti animate-confetti"
            style={{
              left: `${left}%`,
              animationDuration: `${animationDuration}s`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: colors[colorIndex],
              top: `-${size}px`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        );
      }
      setConfettiElements(elements);
    }
  }, [showCelebration, birthdayPeople]);

  if (birthdayPeople.length === 0) {
    return null;
  }

  return (
    <>
      {/* Floating confetti elements */}
      {showCelebration && confettiElements}
      
      <Dialog open={showCelebration} onOpenChange={toggleCelebration}>
        <DialogContent className="bg-gradient-to-br from-friendverse-pink to-friendverse-purple border-0 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              🎂 Chúc mừng sinh nhật! 🎉
            </DialogTitle>
            <DialogDescription className="text-center">
              {birthdayPeople.length === 1 ? (
                <span>Hôm nay là sinh nhật của {birthdayPeople[0].displayName}!</span>
              ) : (
                <span>
                  Hôm nay là sinh nhật của{' '}
                  {birthdayPeople.map((person, i) => (
                    <span key={person.id}>
                      {i > 0 && i === birthdayPeople.length - 1 ? ' và ' : i > 0 ? ', ' : ''}
                      {person.displayName}
                    </span>
                  ))}
                  !
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-wrap justify-center gap-4 my-6">
            {birthdayPeople.map(person => (
              <div key={person.id} className="text-center animate-bounce-in">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white mx-auto mb-2">
                  <img 
                    src={person.avatar}
                    alt={person.displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="font-medium">{person.displayName}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <p className="mb-6 text-lg font-medium">
              Chúc mừng sinh nhật và gửi những lời chúc tốt đẹp nhất!
            </p>
            <Button onClick={toggleCelebration} variant="outline" className="bg-white">
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
