import { useEffect, useRef, useCallback } from 'react';
import type { ManagerTask } from '@/types/agenda';

const ALARM_SOUND_URL = 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg';
const CHECK_INTERVAL = 30_000; // 30s
const FIRED_KEY = 'task-alarms-fired';

function getFiredAlarms(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(FIRED_KEY) || '[]'));
  } catch { return new Set(); }
}

function markFired(taskId: string) {
  const fired = getFiredAlarms();
  fired.add(taskId);
  // Keep only last 200
  const arr = [...fired].slice(-200);
  localStorage.setItem(FIRED_KEY, JSON.stringify(arr));
}

function playAlarmSound() {
  try {
    const audio = new Audio(ALARM_SOUND_URL);
    audio.volume = 0.7;
    audio.play().catch(() => {});
  } catch { }
}

async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function sendNotification(task: ManagerTask) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  
  const timeStr = task.due_time || '';
  new Notification(`⏰ ${task.title}`, {
    body: `Lembrete agendado para ${timeStr}${task.notes ? ' — ' + task.notes : ''}`,
    icon: '/icons/icon-192.png',
    tag: `task-alarm-${task.id}`,
    requireInteraction: true,
  });
}

export function useTaskAlarms(tasks: ManagerTask[]) {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const checkAlarms = useCallback(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const fired = getFiredAlarms();

    const alarmTasks = tasks.filter(t =>
      (t as any).has_alarm &&
      !t.is_completed &&
      t.due_date === todayStr &&
      t.due_time &&
      !fired.has(t.id)
    );

    for (const task of alarmTasks) {
      if (task.due_time! <= currentTime) {
        markFired(task.id);
        playAlarmSound();
        sendNotification(task);
      }
    }
  }, [tasks]);

  // Request permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Periodic check
  useEffect(() => {
    checkAlarms(); // immediate check
    intervalRef.current = setInterval(checkAlarms, CHECK_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkAlarms]);
}
