import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { JsonBinService } from '@/services/jsonBinService';
import { useToast } from '@/components/ui/use-toast';
import { Copy, Check, RefreshCw, Link2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DataSyncPage: React.FC = () => {
  const [binId, setBinId] = useState<string>('');
  const [shareableLink, setShareableLink] = useState<string>('');
  const [inputBinId, setInputBinId] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Chưa đồng bộ');
  const [connecting, setConnecting] = useState<boolean>(false);

  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const loadBinId = async () => {
      try {
        const id = await JsonBinService.getBinId();
        setBinId(id);
        
        // Tạo liên kết có thể chia sẻ
        const link = await JsonBinService.getShareableLink();
        setShareableLink(link);
      } catch (error) {
        console.error('Error loading Bin ID:', error);
        toast({
          title: "Lỗi đồng bộ",
          description: "Không thể kết nối đến dịch vụ đồng bộ.",
          variant: "destructive"
        });
      }
    };

    loadBinId();

    // Đăng ký lắng nghe sự kiện đồng bộ
    const handleDataSync = (event: CustomEvent) => {
      setLastSyncTime(new Date().toLocaleTimeString());
      toast({
        title: "Đồng bộ thành công",
        description: "Dữ liệu của bạn đã được đồng bộ.",
      });
    };

    // Đăng ký lắng nghe sự kiện kết nối bin
    const handleBinConnected = (event: CustomEvent) => {
      setConnecting(false);
      if (event.detail?.binId) {
        setBinId(event.detail.binId);
        toast({
          title: "Kết nối thành công",
          description: "Đã kết nối đến bin đã chia sẻ.",
        });
      }
    };

    window.addEventListener('friendverse_data_sync', handleDataSync as EventListener);
    window.addEventListener('friendverse_bin_connected', handleBinConnected as EventListener);

    // Bắt đầu đồng bộ tự động
    const stopSync = JsonBinService.startSync(30000); // 30 giây

    return () => {
      window.removeEventListener('friendverse_data_sync', handleDataSync as EventListener);
      window.removeEventListener('friendverse_bin_connected', handleBinConnected as EventListener);
      stopSync(); // Dừng đồng bộ khi component unmount
    };
  }, [toast]);

  // Sao chép liên kết bin
  const copyShareableLink = () => {
    navigator.clipboard.writeText(shareableLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: "Đã sao chép",
          description: "Liên kết đã được sao chép vào clipboard.",
        });
      })
      .catch(err => {
        console.error('Lỗi khi sao chép liên kết:', err);
        toast({
          title: "Lỗi",
          description: "Không thể sao chép liên kết.",
          variant: "destructive"
        });
      });
  };

  // Đồng bộ thủ công
  const syncNow = async () => {
    try {
      setSyncing(true);
      await JsonBinService.checkForUpdates();
      setLastSyncTime(new Date().toLocaleTimeString());
      toast({
        title: "Đồng bộ thành công",
        description: "Dữ liệu của bạn đã được đồng bộ.",
      });
    } catch (error) {
      console.error('Error syncing data:', error);
      toast({
        title: "Lỗi đồng bộ",
        description: "Không thể đồng bộ dữ liệu.",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  // Kết nối đến bin được chia sẻ
  const connectToSharedBin = async () => {
    if (!inputBinId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập ID bin.",
        variant: "destructive"
      });
      return;
    }

    try {
      setConnecting(true);
      // Xử lý trường hợp người dùng nhập cả URL hoặc chỉ ID
      let binIdToConnect = inputBinId;
      
      // Nếu là URL, trích xuất ID bin
      if (inputBinId.includes('binId=')) {
        const match = inputBinId.match(/binId=([^&]+)/);
        if (match && match[1]) {
          binIdToConnect = match[1];
        }
      }

      const success = await JsonBinService.useSharedBin(binIdToConnect);
      
      if (success) {
        setBinId(binIdToConnect);
        setInputBinId('');
        toast({
          title: "Kết nối thành công",
          description: "Đã kết nối đến bin đã chia sẻ.",
        });
      } else {
        toast({
          title: "Kết nối thất bại",
          description: "ID bin không hợp lệ.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error connecting to shared bin:', error);
      toast({
        title: "Lỗi kết nối",
        description: "Không thể kết nối đến bin đã chia sẻ.",
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTitle>Chưa đăng nhập</AlertTitle>
          <AlertDescription>
            Bạn cần đăng nhập để sử dụng tính năng đồng bộ dữ liệu.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Đồng bộ dữ liệu</h1>
      
      <Tabs defaultValue="share">
        <TabsList className="mb-4">
          <TabsTrigger value="share">Chia sẻ dữ liệu</TabsTrigger>
          <TabsTrigger value="connect">Kết nối dữ liệu</TabsTrigger>
        </TabsList>
        
        <TabsContent value="share">
          <Card>
            <CardHeader>
              <CardTitle>Chia sẻ dữ liệu</CardTitle>
              <CardDescription>
                Chia sẻ dữ liệu với thiết bị khác hoặc bạn bè
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center mb-2">
                    <h3 className="text-md font-medium mr-2">ID đồng bộ của bạn:</h3>
                    <Badge variant="outline">{binId}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Sao chép liên kết bên dưới và gửi cho người bạn muốn chia sẻ dữ liệu.
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <Input 
                    value={shareableLink} 
                    readOnly 
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyShareableLink}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="flex items-center text-sm text-gray-500">
                  <span className="mr-2">Đồng bộ lần cuối:</span>
                  <span>{lastSyncTime}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={syncNow} disabled={syncing}>
                {syncing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Đang đồng bộ...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Đồng bộ ngay
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="connect">
          <Card>
            <CardHeader>
              <CardTitle>Kết nối dữ liệu</CardTitle>
              <CardDescription>
                Kết nối đến dữ liệu đã được chia sẻ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Nhập ID đồng bộ hoặc liên kết đã được chia sẻ với bạn.
                </p>
                
                <div className="flex space-x-2">
                  <Input 
                    value={inputBinId} 
                    onChange={(e) => setInputBinId(e.target.value)}
                    placeholder="Nhập ID bin hoặc liên kết đồng bộ" 
                    className="flex-1"
                  />
                  <Button
                    variant="default"
                    onClick={connectToSharedBin}
                    disabled={connecting}
                  >
                    {connecting ? (
                      <>
                        <Link2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang kết nối...
                      </>
                    ) : (
                      <>
                        <Link2 className="mr-2 h-4 w-4" />
                        Kết nối
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataSyncPage;
