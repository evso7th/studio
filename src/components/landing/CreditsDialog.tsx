
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function CreditsDialog() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="lg" className="w-full max-w-xs text-lg py-3 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200">
          Credits
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Участники проекта</AlertDialogTitle>
          <AlertDialogDescription>
            <ul className="list-disc space-y-2 pl-5 text-left mt-4">
              <li>
                <strong>Идея подарить игру:</strong> Наталья Пугачова
              </li>
              <li>
                <strong>GameDev:</strong> Евгений Сомов
              </li>
              <li>
                <strong>Тестирование:</strong> Сергей Жуланов
              </li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>Закрыть</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
