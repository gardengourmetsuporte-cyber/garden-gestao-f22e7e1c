import { useEffect, useState } from "react";
import { toast } from "sonner";

export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            toast.success("Conexão restabelecida!", {
                description: "Você está online novamente. Suas alterações voltarão a ser sincronizadas.",
            });
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.error("Você está offline", {
                description: "Verifique sua conexão. Algumas funções podem não estar disponíveis até você voltar.",
                duration: 8000,
            });
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return isOnline;
}
