import { RotateCcw } from "lucide-react";

const OrientationMessage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="bg-muted rounded-lg p-8 max-w-md mx-auto">
        <div className="flex justify-center mb-4">
          <RotateCcw className="h-16 w-16 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">
          Gire seu dispositivo
        </h2>
        <p className="text-muted-foreground">
          Para uma melhor experiência no calendário, vire seu dispositivo para a orientação horizontal.
        </p>
      </div>
    </div>
  );
};

export default OrientationMessage;
