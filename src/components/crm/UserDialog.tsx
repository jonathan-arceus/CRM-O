
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useUsers, AppRole, UserProfile } from '@/hooks/useUsers';
import { useGroups } from '@/hooks/useGroups';
import { useOrganization } from '@/hooks/useOrganization';

const userSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
    role: z.enum(['admin', 'manager', 'agent'] as const),
    groupId: z.string().optional().nullable(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserDialogProps {
    user?: UserProfile;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UserDialog({ user, open, onOpenChange }: UserDialogProps) {
    const { createUser, updateUserRole, updateUserGroup } = useUsers();
    const { groups } = useGroups();
    const { organization } = useOrganization();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            fullName: '',
            email: '',
            password: '',
            role: 'agent' as const,
            groupId: '',
        },
    });

    useEffect(() => {
        if (user) {
            form.reset({
                fullName: user.full_name || '',
                email: user.email,
                password: '', // Don't show password for existing user
                role: (user.role as any) === 'super_admin' ? 'admin' : (user.role as any) || 'agent',
                groupId: user.group_id || '__NONE__',
            });
        } else {
            form.reset({
                fullName: '',
                email: '',
                password: '',
                role: 'agent',
                groupId: '',
            });
        }
    }, [user, form, open]);

    const onSubmit = async (values: UserFormValues) => {
        if (!organization) return;
        setIsSubmitting(true);

        try {
            if (user) {
                // Update existing user
                await Promise.all([
                    updateUserRole(user.id, values.role as AppRole),
                    updateUserGroup(user.id, values.groupId || null),
                ]);
            } else {
                // Create new user
                if (!values.password) {
                    form.setError('password', { message: 'Password is required for new users' });
                    return;
                }
                const groupId = values.groupId === '__NONE__' ? null : values.groupId || null;
                await createUser({
                    email: values.email,
                    password: values.password,
                    fullName: values.fullName,
                    role: values.role as AppRole,
                    organizationId: organization.id,
                    groupId: groupId,
                });
            }
            onOpenChange(false);
        } catch (error) {
            console.error('Error in UserDialog:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{user ? 'Edit User' : 'Create New User'}</DialogTitle>
                    <DialogDescription>
                        {user
                            ? 'Update user permissions and group assignment.'
                            : 'Add a new member to your team. They can then log in with these credentials.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="john@example.com" disabled={!!user} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {!user && (
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="manager">Manager</SelectItem>
                                            <SelectItem value="agent">Agent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="groupId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Group Assignment</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value || ''}
                                        value={field.value || ''}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="No Group" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="__NONE__">— No Group —</SelectItem>
                                            {groups.map((group) => (
                                                <SelectItem key={group.id} value={group.id}>
                                                    {group.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : user ? 'Update User' : 'Create User'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
