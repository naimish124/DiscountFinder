import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Offer, InsertOffer, insertOfferSchema } from "@shared/schema";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

// Form schema with validation
const formSchema = insertOfferSchema
  .extend({
    discountPercentage: z.coerce.number().min(0).max(100),
    minTransaction: z.coerce.number().min(0),
    minDiscountRs: z.coerce.number().min(0).optional(),
    maxDiscountRs: z.coerce.number().min(0).optional(),
  });

// Service types for the form
const serviceTypes = [
  { label: "Bus", value: "bus" },
  { label: "Flight", value: "flight" },
  { label: "Movie", value: "movie" },
  { label: "Bill Payment", value: "bill" },
  { label: "Hotel", value: "hotel" },
  { label: "Food", value: "food" },
  { label: "Shopping", value: "shopping" },
  { label: "Cab", value: "cab" },
];

// Offer types for the form
const offerTypes = [
  { label: "Card Offer", value: "card_offer" },
  { label: "Bank Offer", value: "bank_offer" },
  { label: "New User", value: "new_user" },
  { label: "Seasonal", value: "seasonal" },
  { label: "Festival", value: "festival" },
];

// Card types for the form
const cardTypes = [
  { label: "Credit", value: "credit" },
  { label: "Debit", value: "debit" },
  { label: "Both", value: "both" },
];

// Bank names for the form
const bankNames = [
  { label: "HDFC", value: "hdfc" },
  { label: "SBI", value: "sbi" },
  { label: "ICICI", value: "icici" },
  { label: "Axis", value: "axis" },
  { label: "Kotak", value: "kotak" },
  { label: "Yes Bank", value: "yes" },
  { label: "Other", value: "other" },
];

export default function AdminPage() {
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [isSheetUpdateOpen, setIsSheetUpdateOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isUpdatingFromSheets, setIsUpdatingFromSheets] = useState(false);

  // Fetch all offers
  const { data: offers, isLoading: isLoadingOffers } = useQuery<Offer[]>({
    queryKey: ["/api/offers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/offers");
      const data = await res.json();
      return data.offers;
    },
  });

  // Create a new offer
  const createOfferMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/admin/offers", data);
      return await res.json();
    },
    onSuccess: () => {
      setIsAddDialogOpen(false);
      toast({
        title: "Offer created",
        description: "The offer has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create offer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update an existing offer
  const updateOfferMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<InsertOffer>;
    }) => {
      const res = await apiRequest("PUT", `/api/admin/offers/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      setIsEditDialogOpen(false);
      setSelectedOffer(null);
      toast({
        title: "Offer updated",
        description: "The offer has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update offer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete an offer
  const deleteOfferMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/offers/${id}`);
    },
    onSuccess: () => {
      setIsDeleteDialogOpen(false);
      setSelectedOffer(null);
      toast({
        title: "Offer deleted",
        description: "The offer has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete offer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form for adding a new offer
  const addForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "bus",
      platform: "",
      platformUrl: "",
      promoCode: "",
      minTransaction: 0,
      discountPercentage: 0,
      typeOfOffer: "card_offer",
      isAddon: false,
      cardType: "",
      bankName: "",
      cardName: "",
      description: "",
    },
  });

  // Form for editing an existing offer
  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "bus",
      platform: "",
      platformUrl: "",
      promoCode: "",
      minTransaction: 0,
      discountPercentage: 0,
      typeOfOffer: "card_offer",
      isAddon: false,
      cardType: "",
      bankName: "",
      cardName: "",
      description: "",
    },
  });

  // Handle add form submission
  const onAddSubmit = (data: z.infer<typeof formSchema>) => {
    createOfferMutation.mutate(data);
    setIsManualEntryOpen(false);
  };
  
  // Update offers from Google Sheets
  const updateFromSheetsMutation = useMutation({
    mutationFn: async ({ mode }: { mode: 'append' | 'overwrite' }) => {
      const res = await apiRequest("POST", "/api/admin/offers/sync-from-sheets", { mode });
      return await res.json();
    },
    onSuccess: (data) => {
      setIsSheetUpdateOpen(false);
      setIsUpdatingFromSheets(false);
      toast({
        title: "Offers updated",
        description: `Successfully imported ${data.count} offers from Google Sheets.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
    },
    onError: (error: Error) => {
      setIsUpdatingFromSheets(false);
      toast({
        title: "Failed to update from Google Sheets",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const [updateMode, setUpdateMode] = useState<'append' | 'overwrite'>('append');

  const handleUpdateFromSheets = () => {
    setIsUpdatingFromSheets(true);
    updateFromSheetsMutation.mutate({ mode: updateMode });
  };

  // Handle edit form submission
  const onEditSubmit = (data: z.infer<typeof formSchema>) => {
    if (selectedOffer) {
      updateOfferMutation.mutate({ id: selectedOffer.id, data });
    }
  };

  // Handle opening the edit dialog
  const handleEditOffer = (offer: Offer) => {
    setSelectedOffer(offer);
    editForm.reset({
      ...offer,
      minDiscountRs: offer.minDiscountRs || undefined,
      maxDiscountRs: offer.maxDiscountRs || undefined,
      cardType: offer.cardType || "",
      bankName: offer.bankName || "",
      cardName: offer.cardName || "",
      description: offer.description || "",
    });
    setIsEditDialogOpen(true);
  };

  // Handle opening the delete dialog
  const handleDeleteOffer = (offer: Offer) => {
    setSelectedOffer(offer);
    setIsDeleteDialogOpen(true);
  };

  // Filter offers based on active tab
  const filteredOffers = offers?.filter((offer) => {
    if (activeTab === "all") return true;
    return offer.type === activeTab;
  });

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage card offers and discounts
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Logged in as <span className="font-medium">{user?.username}</span>
          </div>
          <Button variant="secondary" onClick={() => window.location.href = "/"}>
            Go to Home
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Tabs
          defaultValue="all"
          className="w-full"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all">All Offers</TabsTrigger>
              {serviceTypes.map((type) => (
                <TabsTrigger key={type.value} value={type.value}>
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add New Offer</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Offer</DialogTitle>
                  <DialogDescription>
                    Choose how you would like to add offers.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <Card className="cursor-pointer hover:border-primary" onClick={() => {
                    setIsAddDialogOpen(false);
                    setIsManualEntryOpen(true);
                  }}>
                    <CardHeader>
                      <CardTitle>Manual Entry</CardTitle>
                      <CardDescription>Add a single offer by filling out a form</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Create a custom offer with all details specified manually.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary" onClick={() => {
                    setIsAddDialogOpen(false);
                    setIsSheetUpdateOpen(true);
                  }}>
                    <CardHeader>
                      <CardTitle>Update from Google Sheets</CardTitle>
                      <CardDescription>Import latest data from the configured spreadsheet</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Refresh all offers with the latest data from Google Sheets.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </DialogContent>
            </Dialog>

            {/* Manual Entry Dialog */}
            <Dialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Offer - Manual Entry</DialogTitle>
                  <DialogDescription>
                    Enter the details to create a new card offer.
                  </DialogDescription>
                </DialogHeader>
                <Form {...addForm}>
                  <form
                    onSubmit={addForm.handleSubmit(onAddSubmit)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Service Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select service type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {serviceTypes.map((type) => (
                                  <SelectItem
                                    key={type.value}
                                    value={type.value}
                                  >
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="typeOfOffer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Offer Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select offer type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {offerTypes.map((type) => (
                                  <SelectItem
                                    key={type.value}
                                    value={type.value}
                                  >
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="platform"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Platform Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter platform name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="platformUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Platform URL</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="promoCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Promo Code</FormLabel>
                            <FormControl>
                              <Input placeholder="OFFER100" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="minTransaction"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Min Transaction (Rs)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="1000"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="discountPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount Percentage</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="10"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="minDiscountRs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Min Discount (Rs)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="100"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="maxDiscountRs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Discount (Rs)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="500"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Name</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select bank" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No Bank</SelectItem>
                                {bankNames.map((bank) => (
                                  <SelectItem
                                    key={bank.value}
                                    value={bank.value}
                                  >
                                    {bank.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="cardType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Card Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select card type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No Card Type</SelectItem>
                                {cardTypes.map((type) => (
                                  <SelectItem
                                    key={type.value}
                                    value={type.value}
                                  >
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="cardName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Card Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Platinum Credit Card"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="isAddon"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Add-on Offer</FormLabel>
                              <FormDescription>
                                This offer can be combined with other offers
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={addForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter offer description"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsManualEntryOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createOfferMutation.isPending}
                      >
                        {createOfferMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Offer"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Google Sheets Update Dialog */}
            <Dialog open={isSheetUpdateOpen} onOpenChange={setIsSheetUpdateOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Offers from Google Sheets</DialogTitle>
                  <DialogDescription>
                    This will fetch the latest offers from Google Sheets and update the database.
                    Choose whether to append new offers or replace all existing ones.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="mb-4 text-sm text-muted-foreground">
                    The application will connect to the configured Google Sheets document and import all offers.
                    Please choose how you would like to handle the existing data.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroup 
                        value={updateMode} 
                        onValueChange={(value) => setUpdateMode(value as 'append' | 'overwrite')}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="append" id="append" />
                          <Label htmlFor="append">Append - Add new offers while keeping existing ones</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="overwrite" id="overwrite" />
                          <Label htmlFor="overwrite">Overwrite - Replace all existing offers with new data</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                  
                  {isUpdatingFromSheets && (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsSheetUpdateOpen(false)}
                    disabled={isUpdatingFromSheets}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateFromSheets}
                    disabled={isUpdatingFromSheets}
                  >
                    {isUpdatingFromSheets ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update from Google Sheets"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="all" className="space-y-4">
            <OffersTable
              offers={filteredOffers || []}
              isLoading={isLoadingOffers}
              onEdit={handleEditOffer}
              onDelete={handleDeleteOffer}
            />
          </TabsContent>

          {serviceTypes.map((type) => (
            <TabsContent key={type.value} value={type.value} className="space-y-4">
              <OffersTable
                offers={filteredOffers || []}
                isLoading={isLoadingOffers}
                onEdit={handleEditOffer}
                onDelete={handleDeleteOffer}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Offer</DialogTitle>
            <DialogDescription>
              Update the details of the selected offer.
            </DialogDescription>
          </DialogHeader>
          {selectedOffer && (
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(onEditSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select service type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {serviceTypes.map((type) => (
                              <SelectItem
                                key={type.value}
                                value={type.value}
                              >
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="typeOfOffer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Offer Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select offer type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {offerTypes.map((type) => (
                              <SelectItem
                                key={type.value}
                                value={type.value}
                              >
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter platform name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="platformUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="promoCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Promo Code</FormLabel>
                        <FormControl>
                          <Input placeholder="OFFER100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="minTransaction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Transaction (Rs)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1000"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="discountPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Percentage</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="10"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="minDiscountRs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Discount (Rs)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="100"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="maxDiscountRs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Discount (Rs)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="500"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select bank" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Bank</SelectItem>
                            {bankNames.map((bank) => (
                              <SelectItem
                                key={bank.value}
                                value={bank.value}
                              >
                                {bank.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="cardType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Card Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select card type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Card Type</SelectItem>
                            {cardTypes.map((type) => (
                              <SelectItem
                                key={type.value}
                                value={type.value}
                              >
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="cardName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Card Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Platinum Credit Card"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="isAddon"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Add-on Offer</FormLabel>
                          <FormDescription>
                            This offer can be combined with other offers
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter offer description"
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateOfferMutation.isPending}
                  >
                    {updateOfferMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Offer"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Offer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this offer? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {selectedOffer && (
            <>
              <div className="py-4">
                <p className="font-medium">
                  {selectedOffer.platform} - {selectedOffer.promoCode}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedOffer.description}
                </p>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => deleteOfferMutation.mutate(selectedOffer.id)}
                  disabled={deleteOfferMutation.isPending}
                >
                  {deleteOfferMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface OffersTableProps {
  offers: Offer[];
  isLoading: boolean;
  onEdit: (offer: Offer) => void;
  onDelete: (offer: Offer) => void;
}

function OffersTable({ offers, isLoading, onEdit, onDelete }: OffersTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <p className="text-lg font-medium">No offers found</p>
          <p className="text-sm text-muted-foreground">
            Create a new offer to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getServiceTypeLabel = (type: string) => {
    const serviceType = serviceTypes.find((t) => t.value === type);
    return serviceType?.label || type;
  };

  const getOfferTypeLabel = (type: string) => {
    const offerType = offerTypes.find((t) => t.value === type);
    return offerType?.label || type;
  };

  return (
    <Card>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableCaption>A list of all available offers</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Offer Type</TableHead>
                <TableHead>Promo Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Card/Bank</TableHead>
                <TableHead>Min. Tx</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell>
                    <div className="font-medium">{offer.platform}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {offer.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getServiceTypeLabel(offer.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>{getOfferTypeLabel(offer.typeOfOffer)}</TableCell>
                  <TableCell>{offer.promoCode}</TableCell>
                  <TableCell>
                    {offer.discountPercentage}%
                    {offer.maxDiscountRs && (
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        (up to ₹{offer.maxDiscountRs})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {offer.bankName && (
                      <div className="capitalize">{offer.bankName}</div>
                    )}
                    {offer.cardName && (
                      <div className="text-xs">{offer.cardName}</div>
                    )}
                  </TableCell>
                  <TableCell>₹{offer.minTransaction}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(offer)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(offer)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}